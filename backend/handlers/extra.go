package handlers

import (
	"fmt"
	"gonote/db"
	"gonote/models"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadFile - POST /api/upload
func UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Create uploads dir if not exists
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename)
	dst := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Construct public URL
	// In production this should be a variable base URL
	url := "/uploads/" + filename

	c.JSON(http.StatusOK, gin.H{
		"url":      url,
		"filename": file.Filename,
		"type":     file.Header.Get("Content-Type"),
		"size":     file.Size,
	})
}

// AddComment - POST /api/notes/:id/comments
func AddComment(c *gin.Context) {
	noteId := c.Param("id")
	userId := c.GetString("userId")

	// Get Username for snapshot
	var user models.User
	if err := db.DB.Where("id = ?", userId).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		Content    string `json:"content"`
		QuotedText string `json:"quotedText"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment := models.Comment{
		ID:         fmt.Sprintf("c-%d", time.Now().UnixNano()),
		NoteID:     noteId,
		UserID:     userId,
		Username:   user.Username,
		Content:    req.Content,
		QuotedText: req.QuotedText,
		CreatedAt:  time.Now(),
	}

	if err := db.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save comment"})
		return
	}

	c.JSON(http.StatusCreated, comment)
}
