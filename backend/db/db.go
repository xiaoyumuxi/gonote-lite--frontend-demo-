package db

import (
	"gonote/models"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	var err error
	DB, err = gorm.Open(sqlite.Open("gonote.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connection established")

	// Auto-Migrate Models
	err = DB.AutoMigrate(
		&models.User{},
		&models.Note{},
		&models.Folder{},
		&models.Event{},
		&models.Collaborator{},
		&models.Family{},
		&models.FamilyMember{},
		&models.Attachment{},
		&models.Comment{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database migration completed")
}
