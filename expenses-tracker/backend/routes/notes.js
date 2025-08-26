const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Get all notes for a user
router.get("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to get notes",
    });
  }
});

// Create new note
router.post("/", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Title and content are required",
      });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create note",
    });
  }
});

// Update note
router.put("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;
    const { title, content } = req.body;

    const note = await prisma.note.update({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this note
      },
      data: {
        title: title || undefined,
        content: content || undefined,
      },
    });

    res.json({
      success: true,
      message: "Note updated successfully",
      note,
    });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update note",
    });
  }
});

// Delete note
router.delete("/:id", async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id || 1; // Temporary for development
    const { id } = req.params;

    await prisma.note.delete({
      where: {
        id: parseInt(id),
        userId, // Ensure user owns this note
      },
    });

    res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete note",
    });
  }
});

module.exports = router;
