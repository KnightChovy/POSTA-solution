const Satellite = require("../models/Satellite");
const Post = require("../models/Post");
const Category = require("../models/Category");
// DONE: Get all satellites
const getAllSatellites = async (req, res) => {
  try {
    const satellites = await Satellite.find({ status: 'ACTIVE' });
    return res.status(200).json({ satellites });
  } catch (error) {
    return res.status(500).json({ error });
  }
}

// DONE: Add a new satellite
const addSatellite = async (req, res) => {
  try {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    const { url, username, password, category } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const existingUrl = await Satellite.findOne({ url });
    if (existingUrl) {
      return res.status(400).json({ message: "Website vệ tinh đã tồn tại" });
    }

    // Validate categories if provided
    if (category && category.length > 0) {
      const validCategories = await Category.find({
        _id: { $in: category },
        status: 'ACTIVE'
      });

      if (validCategories.length !== category.length) {
        return res.status(400).json({
          message: "One or more categories are invalid or inactive"
        });
      }
    }

    const newSatellite = new Satellite({
      url,
      username,
      password,
      category: category || []
    });

    newSatellite
      .save()
      .then((satellite) => res.status(201).json({ satellite }))
      .catch((error) => res.status(500).json({ error }));
  } catch (error) {
    res.status(500).json({ error });
  }
};

// DONE: Get number of published posts across all satellites
const getNumberOfPublishedPosts = async (req, res) => {
  try {
    const result = await Post.aggregate([
      {
        $unwind: '$postedSatellite'
      },
      {
        $group: {
          _id: null,
          totalLength: { $sum: 1 }
        }
      }
    ]);
    if (result.length <= 0) {
      return res.json({ success: false, message: 'No published posts found.' });
    }
    return res.json({ success: true, totalPublishedPosts: result[0]?.totalLength || 0 });
  } catch (error) {
    console.error("Error counting published posts:", error);
    res.status(500).json({ error });
  }
}

// DONE: Get number of error posts across all satellites
const getNumberOfErrorPosts = async (req, res) => {
  try {
    const result = await Post.aggregate([
      {
        $unwind: '$errorSatellite'
      },
      {
        $group: {
          _id: null,
          totalLength: { $sum: 1 }
        }
      }
    ]);
    if (result.length <= 0) {
      return res.json({ success: false, message: 'No error posts found.' });
    }
    return res.json({ success: true, totalErrorPosts: result[0]?.totalLength || 0 });
  } catch (error) {
    console.error("Error counting error posts:", error);
    res.status(500).json({ error });
  }
}

// DONE: Get overall progress of all posts
const getOverallProgress = async (req, res) => {
  try {
    const posts = await Post.find({ successfulRate: { $ne: 0 } });
    const total = posts.reduce((sum, p) => sum + p.successfulRate, 0);
    const average = total / posts.length;
    if (isNaN(average)) {
      return res.status(200).json({ success: true, averageSuccessfulRate: 0 });
    }
    res.status(200).json({ success: true, averageSuccessfulRate: average });
  } catch (error) {
    res.status(500).json({ error });
  }
}

// DONE: Update satellite details
const updateSatellite = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, username, password } = req.body;

    const satellite = await Satellite.findById(id);
    if (!satellite) {
      return res.status(404).json({ message: "Satellite not found" });
    }

    const updatedSatellite = await Satellite.findByIdAndUpdate(
      id,
      { url, username, password },
      { new: true }
    );

    res.status(200).json({
      message: "Satellite updated successfully",
      satellite: updatedSatellite
    });
  } catch (error) {
    console.error("Error updating satellite:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const deleteSatellite = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSatellite = await Satellite.findByIdAndUpdate(
      id,
      { status: 'INACTIVE' },
      { new: true }
    );
    if (!deletedSatellite) {
      return res.status(404).json({ message: "Satellite not found" });
    }
    res.status(200).json({ message: "Satellite deleted successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
}

module.exports = {
  addSatellite,
  getNumberOfPublishedPosts,
  getNumberOfErrorPosts,
  getOverallProgress,
  getAllSatellites,
  updateSatellite,
  deleteSatellite
};