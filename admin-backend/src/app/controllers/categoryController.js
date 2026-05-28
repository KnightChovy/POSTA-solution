const Category = require('../models/Category')
const getAllCategories = async (req, res) => { 
  try {
    const categories = await Category.find()
    return res.status(200).json(categories)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error.message })
  }
}

const addNewCategory = async (req, res) => { 
  try {
    const { name } = req.body
    const newCategory = new Category({ name })
    await newCategory.save()
    res.status(201).json({message: "Thêm thành công danh mục mới", newCategory})
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })  
  }
}



module.exports = { getAllCategories, addNewCategory }