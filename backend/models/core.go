package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           string `gorm:"primaryKey" json:"id"`
	Username     string `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string `json:"-"`
	AvatarColor  string `json:"avatarColor"`
	// FamilyID 已移除，改用 FamilyMember 多对多关联
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Note struct {
	ID        string         `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID   string  `gorm:"index" json:"userId"`
	FamilyID *string `gorm:"index" json:"familyId"` // 家庭共享笔记的家庭编号
	FolderID string  `gorm:"index" json:"folderId"`
	Title    string  `json:"title"`
	Content  string  `gorm:"type:text" json:"content"`

	// Sharing Configuration
	IsPublic         bool   `gorm:"default:false" json:"isPublic"`
	PublicPermission string `gorm:"default:'read'" json:"publicPermission"`

	// Relations
	Attachments   []Attachment   `gorm:"foreignKey:NoteID" json:"attachments"`
	Comments      []Comment      `gorm:"foreignKey:NoteID" json:"comments"`
	Collaborators []Collaborator `gorm:"foreignKey:NoteID" json:"collaborators"`
}

type Folder struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	UserID    string    `gorm:"index" json:"userId"`
	FamilyID  *string   `gorm:"index" json:"familyId"` // 家庭共享文件夹
	Name      string    `json:"name"`
	Icon      string    `json:"icon"`
	Type      string    `json:"type"` // 'user', 'trash', 'family'
	CreatedAt time.Time `json:"createdAt"`
}

type Collaborator struct {
	NoteID      string `gorm:"primaryKey" json:"noteId"`
	UserID      string `gorm:"primaryKey" json:"userId"`
	Username    string `json:"username"`
	AvatarColor string `json:"avatarColor"`
	Permission  string `json:"permission"`
}
