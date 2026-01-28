package models

import (
	"time"
)

type Attachment struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	NoteID    string    `gorm:"index" json:"noteId"`
	Name      string    `json:"name"`
	Type      string    `json:"type"` // MIME type
	Size      int64     `json:"size"` // Bytes
	FilePath  string    `json:"-"`    // Local path (server side only)
	URL       string    `json:"url"`  // Public URL /uploads/xxx
	CreatedAt time.Time `json:"createdAt"`
}

type Comment struct {
	ID         string    `gorm:"primaryKey" json:"id"`
	NoteID     string    `gorm:"index" json:"noteId"`
	UserID     string    `gorm:"index" json:"userId"`
	Username   string    `json:"username"` // Snapshot of username
	Content    string    `json:"content"`
	QuotedText string    `json:"quotedText"` // Selection context
	CreatedAt  time.Time `json:"createdAt"`
}
