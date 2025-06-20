// const express = require(express)
// const FolderModel = require('../models/Folder')

export const createFolder = async (req, res) => {
  try {
    const folder = new FolderModel({
      name: req.body.name,
      parent: req.body.parent || null,
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    console.error("Error creating folder:", err);
    res.status(500).json({ error: "Failed to create folder" });
  }
}

export const getFolder = async (req, res) => {
  try {
    log("reached")
    const parent = req.query.parent || null;
    const folders = await FolderModel.find({ parent, trashed: false }).sort({ createdAt: 1 });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch folders" });
  }
}

export const getFolderById = async (req, res) => {
  try {
    const folder = await FolderModel.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: "Folder not found" });
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch folder" });
  }
}