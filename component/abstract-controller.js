/* eslint-disable import/no-extraneous-dependencies */
const md5 = require('crypto-js/md5');
const HttpStatus = require('http-status-codes');
const docblockParser = require('docblock-parser');
const AnnotationParser = require('@conga/annotations/lib/parseres6');
const { checkSchema, validationResult } = require('express-validator');

const Docs = require('../docs');
const NotImplementedError = require('./error/not-implemented');
const MissingMethodAnnotationsError = require('./error/missing-method-annotations');
const MissingAnnotationKeyError = require('./error/missing-annotation-key');
const { useDto } = require('../utils/dto');


class AbstractController {
  constructor() {
    this.mountPoint = AbstractController.DEFAULT_MOUNTING_POINT;
    this.config = null;
    this.container = null;
    this.app = null;
    this._annotations = null;
    this.namespace = null;
    this.dto = {};
  }

  /**
   * Register the controller
   * @abstract
   */
  async register() {
    throw new NotImplementedError();
  }

  /**
   * Build absolute Url using buildRoute
   * @param {*} req
   * @param {string} relativePath
   */
  absoluteSelfUrl(req, relativePath) {
    return this.absoluteUrl(req, this.buildRoute(relativePath));
  }

  /**
   * Build absolute Url
   * @param {*} req
   * @param {string} relativePath
   */
  absoluteUrl(req, relativePath) {
    const { port } = this.container.$config.$express;

    if (Number(port) === 80) {
      return `${ req.protocol }://${ req.hostname }${ relativePath }`;
    }

    return `${ req.protocol }://${ req.hostname }:${ port }${ relativePath }`;
  }

  /**
   * Get annotations
   */
  async annotations() {
    if (this._annotations) {
      return this._annotations;
    }

    const source = this.constructor.toString();
    const parser = new AnnotationParser();
    this._annotations = parser.parseSource(source).methods || [];

    return this._annotations;
  }

  /**
   * Read docblock annotation tag, fallbacks to default if annotaion doesn't exist
   * @param {*} docBlock
   * @param {string} annotation
   * @param {*} defaultValue
   * @returns {*}
   */
  readAnnotationIfExists(docBlock, annotation, defaultValue = null) {
    return this.hasAnnotation(docBlock, annotation)
      ? this.readAnnotation(docBlock, annotation)
      : defaultValue;
  }

  /**
   * @param {*} docBlock
   * @param {string} annotation
   * @returns {boolean}
   */
  hasAnnotation(docBlock, annotation) {
    const tags = docBlock.tags || {};

    return Object.prototype.hasOwnProperty.call(tags, annotation);
  }

  /**
   * Read docblock annotation tag
   * @param {*} docBlock
   * @param {string} key
   */
  readAnnotation(docBlock, key) {
    const tags = docBlock.tags || {};

    if (!tags[key]) {
      throw new MissingAnnotationKeyError(key);
    }

    return (tags[key] || '')
      .replace('\n', '')
      .replace(/\/+/, '/')
      .replace(/^\//, '')
      .replace(/\/$/, '');
  }

  /**
   * Mount a route using method annotations
   * only if pagination service available
   * @param {*} args
   */
  async mountIfPaginate(...args) {
    if (this.paginate) {
      return this.mount(...args);
    }
  }

  /**
   * Mount a route using method annotations
   * @param {string} method
   */
  async mount(method, middlewares = []) {
    let annotations = await this.annotations();

    annotations = annotations.filter(a => a.name === method)[0]; // eslint-disable-line

    if (!annotations || !annotations.comment) {
      throw new MissingMethodAnnotationsError(method);
    }

    const annotationMiddlewares = [];
    const docBlock = docblockParser.parse(annotations.comment);
    const httpVerb = this.readAnnotation(docBlock, AbstractController.ANNOTATION_VERB);
    const route = this.readAnnotation(docBlock, AbstractController.ANNOTATION_PATH);
    const expiresIn = this.readAnnotationIfExists(docBlock, AbstractController.ANNOTATION_EXPIRES);
    const raw = this.hasAnnotation(docBlock, AbstractController.ANNOTATION_RAW);
    const dtoName = this.readAnnotationIfExists(docBlock, AbstractController.ANNOTATION_DTO);

    if (this.hasAnnotation(docBlock, AbstractController.ANNOTATION_MEMBER)) {
      const scope = this.readAnnotation(docBlock, AbstractController.ANNOTATION_MEMBER);
      annotationMiddlewares.push(this.getMemberMiddleware(scope || null));
    }

    const schemaName = this.readAnnotationIfExists(
      docBlock,
      AbstractController.ANNOTATION_VALIDATE,
    );
    const validationSchema = schemaName ? this[schemaName] : null;
    const handler = expiresIn
      ? this.applyCacheDecorator(this[method], route, expiresIn)
      : this[method].bind(this);

    return this.route({
      validationSchema,
      middlewares: [...annotationMiddlewares, ...middlewares],
      httpVerb,
      handler: (dtoName && this.dto[dtoName])
        ? (...args) => handler(...args).then((data) => useDto(this.dto[dtoName], data))
        : handler,
      format: !raw,
      route,
    });
  }

  /**
   * Adds handler cache if service is available
   *
   * @param {Function} originalHandler
   * @param {String} route
   * @param {Number} expiresIn - seconds
   * @returns {Function}
   */
  applyCacheDecorator(originalHandler, route, expiresIn) {
    const { cache } = this.container;

    if (!cache) {
      return originalHandler;
    }

    return async (req, res, next) => {
      const { params, body, query } = req;
      const argsKey = md5(JSON.stringify({ params, body, query })).toString();
      const cacheKey = `/${ this.constructor.name }::${ this.buildRoute(route) }(${ argsKey })`;
      const cachedResponseRaw = await cache.get(cacheKey);

      if (cachedResponseRaw) {
        try {
          const cachedResponse = JSON.parse(cachedResponseRaw);

          res.set('X-Cache', 'HIT');

          return cachedResponse;
        } catch (e) {
          this.container.logger.warn(
            `Broken cache result for "${ route }": ${ e.message }.`,
          );
        }
      }

      const response = await originalHandler.bind(this)(req, res, next);

      try {
        await cache.set(
          cacheKey,
          JSON.stringify(response),
          'EX',
          expiresIn,
        );
      } catch (e) {
        this.container.logger.warn(
          `Unable to cache response for "${ route }": ${ e.message }`,
        );
      }

      return response;
    };
  }

  /**
   * Build absolute route path
   * @param {string} route
   */
  buildRoute(route) {
    let absolutePath = this.mountPoint.endsWith('/')
      ? this.mountPoint.slice(0, -1)
      : this.mountPoint;
    if (!route.startsWith('/')) {
      absolutePath += '/';
    }
    absolutePath += route;
    return absolutePath;
  }

  /**
   * Mount a new route
   * @param {string} params.httpVerb
   * @param {string} params.route
   * @param {Function} params.handler
   * @param {*} [params.validationSchema]
   * @param {boolean} [params.format=true]
   * @param {Array<Function>} [params.middlewares]
   */
  route({
    validationSchema = null,
    middlewares = [],
    httpVerb,
    handler,
    format = true,
    route,
  }) {
    const args = [this.buildRoute(route)];

    args.push(...middlewares.filter((m) => m.beforeValidation).map((m) => m.middleware));

    if (validationSchema) {
      // schema validation middleware
      args.push(typeof validationSchema === 'function' ? validationSchema : checkSchema(validationSchema));

      // validation handling middleware
      args.push((req, res, next) => {
        try {
          validationResult(req).throw();
        } catch (error) {
          return this.error(
            res,
            error,
            this.HttpStatus.UNPROCESSABLE_ENTITY,
            error.mapped(),
          );
        }

        next();
      });

      // Register validation schema for docs generation
      // @todo move it somewhere...
      if (this.container[Docs.SERVICE]) {
        this.container[Docs.SERVICE].setVaidationSchema(
          this.buildRoute(route),
          httpVerb,
          validationSchema,
        );
      }
    }

    args.push(...middlewares.filter((m) => !m.beforeValidation));

    if (format) {
      // handler middleware
      args.push(async (req, res, next) => {
        try {
          req.$$data = await handler(req, res);
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            return this.error(res, 'Duplicate Entry', this.HttpStatus.CONFLICT);
          }

          this.container.logger.error(error);

          return this.error(res, error, error.status || this.HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // case we have data returned
        if (!res.headersSent) {
          next();
        }
      });

      // result formatting
      args.push((req, res) => this.success(res, req.$$data));
    } else {
      args.push(handler);
    }

    // Calls regular express endpoint creationg method (e.g. app.put(...args), app.get(...args))
    this.app[httpVerb.toLowerCase()](...args);

    return this;
  }

  /**
   * Success Response
   * @param {Response} res
   * @param {*} data
   */
  success(res, data) {
    return res.json({ error: null, data });
  }

  /**
   * Not found error response
   * @param {Response} res
   * @param {*} metadata
   */
  notFoundError(res, message = HttpStatus.getStatusText(HttpStatus.NOT_FOUND), metadata = null) {
    return this.error(
      res,
      message,
      HttpStatus.NOT_FOUND,
      metadata,
    );
  }

  /**
   * No Content
   * @param {*} res
   */
  noContent(res) {
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  /**
   * Error response
   * @param {Response} res
   * @param {Error} error
   * @param {number} httpStatus
   * @param {*} metadata
   */
  error(res, error, httpStatus = HttpStatus.INTERNAL_SERVER_ERROR, metadata = null) {
    const result = { error: (error && error.message) || error, data: null };

    if (metadata) {
      result.metadata = metadata;
    }

    return res.status(httpStatus).json(result);
  }

  /**
   * Bad request error response
   * @param {Response} res
   * @param {string} message
   */
  badRequest(res, message) {
    return this.error(
      res,
      message || HttpStatus.getStatusText(HttpStatus.BAD_REQUEST),
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Forbidden error response
   * @param {Response} res
   * @param {string} message
   */
  forbiddenError(res, message) {
    return this.error(
      res,
      message || HttpStatus.getStatusText(HttpStatus.FORBIDDEN),
      HttpStatus.FORBIDDEN,
    );
  }

  /**
   * Unauthorized error response
   * @param {Response} res
   * @param {string} message
   */
  unauthorizedError(res, message) {
    return this.error(
      res,
      message || HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED),
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * Conflict error response
   * @param {Response} res
   * @param {string} message
   */
  conflictError(res, message) {
    return this.error(
      res,
      message || HttpStatus.getStatusText(HttpStatus.CONFLICT),
      HttpStatus.CONFLICT,
    );
  }

  /**
   * Setup controller
   * @param {Config} config
   * @param {Container} container
   * @param {Express} app
   */
  async setup(config, container, app) {
    this.config = config;
    this.container = container;
    this.app = app;

    return this;
  }

  /**
   * Trigger an event
   * @param {string} namespace
   * @param {string} name
   * @param {*} value
   * @todo think on abstracting this
   */
  event(name, value = null) {
    if (this.container && this.container.event) {
      this.container.event
        .bus(this.namespace)
        .emitAsync(name, value);
    }

    return this;
  }

  /**
   * Set namespace
   * @param {string} namespace
   */
  setNamespace(namespace) {
    this.namespace = namespace;

    return this;
  }

  /**
   * @param {object} dto
   */
  setDto(dto) {
    this.dto = dto;
  }


  /**
   * @param {string|Array} scope
   */
  getMemberMiddleware(scope = null) {
    return async (req, res, next) => {
      const member = await this.container.db.Member.scope(scope).findOneByIdentityId(req.user.id);

      if (!member) {
        this.forbiddenError(res, 'Member is required');
      } else {
        req.member = member;
        next();
      }
    };
  }


  /**
   * @param {string} role
   */
  getAccessByRoleMiddleware(role) {
    return (req, res, next) => {
      if (req.user?.role === role) {
        next();
      } else {
        this.forbiddenError(res);
      }
    };
  }


  /**
   * Get pagination service
   */
  get paginate() {
    return this.container.paginate;
  }

  /**
   * Get HTTP statuses object
   */
  get HttpStatus() {
    return HttpStatus;
  }

  /**
   * Cache expire time annotation
   */
  static get ANNOTATION_EXPIRES() {
    return 'expires';
  }

  /**
   * Raw request annotation key
   */
  static get ANNOTATION_RAW() {
    return 'raw';
  }

  /**
   * Validation schema annotation key
   */
  static get ANNOTATION_VALIDATE() {
    return 'validate';
  }

  /**
   * HTTP Verb annotation key
   */
  static get ANNOTATION_VERB() {
    return 'verb';
  }

  /**
   * Path annotation key
   */
  static get ANNOTATION_PATH() {
    return 'path';
  }

  /**
   * Member annotation key
   */
  static get ANNOTATION_MEMBER() {
    return 'withMember';
  }

  /**
   * Member annotation key
   */
  static get ANNOTATION_DTO() {
    return 'useDto';
  }


  /**
   * Default mounting point
   */
  static get DEFAULT_MOUNTING_POINT() {
    return '/';
  }
}

module.exports = AbstractController;
