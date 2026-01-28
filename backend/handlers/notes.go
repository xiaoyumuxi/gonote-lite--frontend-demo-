package handlers

import (
	"gonote/db"
	"gonote/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetNotes - GET /api/notes?folderId=...
// 返回用户自己的笔记 + 用户所属家庭的共享笔记
func GetNotes(c *gin.Context) {
	userId := c.GetString("userId")
	folderId := c.Query("folderId")
	search := c.Query("search")
	familyOnly := c.Query("familyOnly") // 仅获取家庭共享笔记

	// 获取用户信息，检查是否有家庭
	var user models.User
	db.DB.First(&user, "id = ?", userId)

	var notes []models.Note

	if familyOnly == "true" && user.FamilyID != nil {
		// 仅返回家庭共享笔记
		query := db.DB.Where("family_id = ?", *user.FamilyID)
		if search != "" {
			query = query.Where("title LIKE ? OR content LIKE ?", "%"+search+"%", "%"+search+"%")
		}
		query.Order("updated_at desc").Find(&notes)
	} else {
		// 返回用户自己的笔记
		query := db.DB.Where("user_id = ? AND (family_id IS NULL OR family_id = '')", userId)

		if folderId != "" {
			query = query.Where("folder_id = ?", folderId)
		}

		if search != "" {
			query = query.Where("title LIKE ? OR content LIKE ?", "%"+search+"%", "%"+search+"%")
		}

		query.Order("updated_at desc").Find(&notes)

		// 如果用户有家庭，也查询家庭共享笔记并合并
		if user.FamilyID != nil && folderId == "" && familyOnly != "false" {
			var familyNotes []models.Note
			familyQuery := db.DB.Where("family_id = ?", *user.FamilyID)
			if search != "" {
				familyQuery = familyQuery.Where("title LIKE ? OR content LIKE ?", "%"+search+"%", "%"+search+"%")
			}
			familyQuery.Order("updated_at desc").Find(&familyNotes)
			notes = append(notes, familyNotes...)
		}
	}

	c.JSON(http.StatusOK, notes)
}

// CreateNote - POST /api/notes
func CreateNote(c *gin.Context) {
	var note models.Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	note.UserID = c.GetString("userId")
	// Ensure ID is set (if not provided by frontend)
	if note.ID == "" {
		// In real app, use UUID lib. For now, assume frontend sends ID or simple fallback
		note.ID = "n-" + note.Title // simplified
	}

	if err := db.DB.Create(&note).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create note"})
		return
	}
	c.JSON(http.StatusCreated, note)
}

// UpdateNote - PUT /api/notes/:id
func UpdateNote(c *gin.Context) {
	id := c.Param("id")
	userId := c.GetString("userId")

	var note models.Note
	if err := db.DB.Where("id = ? AND user_id = ?", id, userId).First(&note).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	var updateData models.Note
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	note.Title = updateData.Title
	note.Content = updateData.Content
	note.UpdatedAt = updateData.UpdatedAt // Sync time from frontend or use database time

	db.DB.Save(&note)
	c.JSON(http.StatusOK, note)
}

// DeleteNote - DELETE /api/notes/:id
func DeleteNote(c *gin.Context) {
	id := c.Param("id")
	userId := c.GetString("userId")

	if err := db.DB.Where("id = ? AND user_id = ?", id, userId).Delete(&models.Note{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Note deleted"})
}
