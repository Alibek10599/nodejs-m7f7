const User = require("../models/mongoose-user");

module.exports = {
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
};
