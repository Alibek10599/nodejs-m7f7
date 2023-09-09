// const ProductValidation = require("../validator/ProductValidation");
// const IdParamsValidation = require("../validator/IdParamsValidation");
const User = require("../models/user");
// const Size = require("../models/size");
// const Category = require("../models/category");
// const Brand = require("../models/brand");
// const Image = require("../models/image");
// const { removeFromCloudinary } = require("../utils/cloudinaryHandler");
// const handleImages = require("../utils/imageHandler");
// const createCategories = require("../utils/categoriesHandler");

module.exports = {
  //  ---------------------------------------- //GetCategories&sizes&Brands//--------------------------- //
//   Getoptions: async (req, res) => {
//     try {
//       const options = {};

//       const getSizeNames = Size.find({}, { name: 1, _id: 1 }).lean().exec();
//       const categories = await Category.find({}).lean().exec();
//       const getBrandNames = Brand.find({}, { name: 1, _id: 1 }).lean().exec();

//       const [sizeNames, brandNames] = await Promise.all([
//         getSizeNames,
//         getBrandNames,
//       ]);

//       options.sizes = sizeNames;
//       options.categories = createCategories(categories);
//       options.brands = brandNames;

//       return res.status(200).json(options);
//     } catch (error) {
//       return res.status(500).send("Error: " + error.message);
//     }
//   },

  //  ---------------------------------------- //GetOneProduct//--------------------------- //
//   GetOneProduct: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { errors, isValid } = IdParamsValidation(req.params);
//       if (!isValid) {
//         return res.status(400).json(errors);
//       }

//       const product = await Product.findById(id)
//         .populate("images", "_id url cloudinary_id")
//         .select(
//           "_id name price countInStock images sizes category brand isFeatured isArchived description"
//         );

//       if (!product) {
//         return res.status(404).json({ message: "Product not found" });
//       }
//       return res.status(200).json(product);
//     } catch (error) {
//       return res.status(500).send("Error: " + error.message);
//     }
//   },
  //  ---------------------------------------- //GetUsers//--------------------------- //
    GetUsers: async (req, res) => {
        try {
            const users = await User.aggregate([
                {
                    $match: {},
                },
                // {
                //     $lookup: {
                //         from: "image",
                //         localField: "brand",
                //         foreignField: "_id",
                //         as: "brand",
                //     },
                // },
                // {
                //     $unwind: "$brand",
                // },
                {
                  $sort: { createdAt: -1 },
                },
                {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    email: 1,
                    countInStock: 1,
                    // "brand.name": 1,
                    // image: { _id: 1, url: 1, cloudinary_id: 1 },
                    // sizes: { _id: 1, name: 1 },
                    // category: {
                    //     _id: 1,
                    //     name: { $arrayElemAt: ["$category.name", 0] },
                    //     parentCategory: { $arrayElemAt: ["$parentCategory.name", 0] },
                    // },
                    createdAt: 1,
                    updatedAt: 1,
                    isFeatured: 1,
                    isArchived: 1,
                },
            },
        ]);

        return res.status(200).json(users);

        } catch (error) {
            return res.status(500).send("Error: " + error.message);
        }
    },
  //  ---------------------------------------- //DeleteProductImages//--------------------------- //
//   DeleteProductImages: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { url, _id, cloudinary_id } = req.body;
//       const { errors, isValid } = IdParamsValidation(req.params);
//       if (!isValid) {
//         return res.status(400).json(errors);
//       }

//       const image = await Image.findById(_id);
//       const product = await Product.findById(id);

//       if (!image) {
//         return res.status(404).json("image not found");
//       }
//       await removeFromCloudinary(cloudinary_id);
//       await image.remove();
//       product.images.pull(_id);
//       await product.save();
//       return res.status(200).json();
//     } catch (error) {
//       return res.status(500).send("Error: " + error.message);
//     }
//   },
  //  ---------------------------------------- //UpdateProducts//--------------------------- //
//   UpdateProduct: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const {
//         name,
//         description,
//         price,
//         category,
//         sizes,
//         countInStock,
//         brand,
//         isFeatured,
//         isArchived,
//       } = req.body;
//       const { errors, isValid } = IdParamsValidation(req.params);
//       if (!isValid) {
//         return res.status(400).json(errors);
//       }
//       const product = await Product.findById(id);
//       if (!product) {
//         return res.status(404).json("product not found");
//       }
//       const createdImages = await handleImages(req.body.images);

//       product.images.push(...createdImages);
//       product.name = name;
//       product.description = description;
//       product.price = price;
//       product.category = category;
//       product.sizes = sizes;
//       product.countInStock = countInStock;
//       product.brand = brand;
//       product.isFeatured = isFeatured;
//       product.isArchived = isArchived;

//       const updatedProduct = await product.save();
//       return res.status(200).json(updatedProduct);
//     } catch (error) {
//       return res.status(500).send("Error: " + error.message);
//     }
//   },
};
