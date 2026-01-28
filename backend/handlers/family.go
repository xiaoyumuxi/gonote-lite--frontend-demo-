package handlers

import (
	"gonote/db"
	"gonote/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateFamily - 创建新家庭
func CreateFamily(c *gin.Context) {
	userId := c.GetString("userId")

	var req struct {
		Name string `json:"name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供家庭名称"})
		return
	}

	// 检查用户是否已有家庭
	var user models.User
	if err := db.DB.First(&user, "id = ?", userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	if user.FamilyID != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "您已属于一个家庭，请先退出当前家庭"})
		return
	}

	// 生成新的家庭 ID
	familyId := "family-" + uuid.New().String()[:8]

	// 更新用户的家庭 ID
	user.FamilyID = &familyId
	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建家庭失败"})
		return
	}

	// 自动创建家庭共享文件夹
	familyFolder := models.Folder{
		ID:        "folder-" + familyId,
		UserID:    userId,
		FamilyID:  &familyId,
		Name:      req.Name + " 的共享",
		Icon:      "🏠",
		Type:      "family",
		CreatedAt: time.Now(),
	}
	db.DB.Create(&familyFolder)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "家庭创建成功",
		"familyId": familyId,
		"folder":   familyFolder,
	})
}

// JoinFamily - 加入已存在的家庭
func JoinFamily(c *gin.Context) {
	userId := c.GetString("userId")

	var req struct {
		FamilyID string `json:"familyId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供家庭编号"})
		return
	}

	// 检查用户是否已有家庭
	var user models.User
	if err := db.DB.First(&user, "id = ?", userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	if user.FamilyID != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "您已属于一个家庭，请先退出当前家庭"})
		return
	}

	// 检查该家庭是否存在（至少有一个成员）
	var existingMember models.User
	if err := db.DB.Where("family_id = ?", req.FamilyID).First(&existingMember).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "家庭不存在，请检查家庭编号"})
		return
	}

	// 加入家庭
	user.FamilyID = &req.FamilyID
	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "加入家庭失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "成功加入家庭",
		"familyId": req.FamilyID,
	})
}

// LeaveFamily - 退出当前家庭
func LeaveFamily(c *gin.Context) {
	userId := c.GetString("userId")

	var user models.User
	if err := db.DB.First(&user, "id = ?", userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	if user.FamilyID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "您当前不属于任何家庭"})
		return
	}

	user.FamilyID = nil
	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "退出家庭失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "已退出家庭"})
}

// GetFamilyMembers - 获取家庭成员列表
func GetFamilyMembers(c *gin.Context) {
	userId := c.GetString("userId")

	var user models.User
	if err := db.DB.First(&user, "id = ?", userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	if user.FamilyID == nil {
		c.JSON(http.StatusOK, gin.H{
			"familyId": nil,
			"members":  []models.User{},
		})
		return
	}

	var members []models.User
	db.DB.Where("family_id = ?", *user.FamilyID).Find(&members)

	c.JSON(http.StatusOK, gin.H{
		"familyId": *user.FamilyID,
		"members":  members,
	})
}

// GetFamilyNotes - 获取家庭共享笔记
func GetFamilyNotes(c *gin.Context) {
	userId := c.GetString("userId")

	var user models.User
	if err := db.DB.First(&user, "id = ?", userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	if user.FamilyID == nil {
		c.JSON(http.StatusOK, []models.Note{})
		return
	}

	var notes []models.Note
	db.DB.Where("family_id = ?", *user.FamilyID).Order("updated_at desc").Find(&notes)

	c.JSON(http.StatusOK, notes)
}
