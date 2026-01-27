package main

import (
	"log"
	"gonote/db"
	"gonote/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize DB
	db.Connect()
	
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Simple Mock Auth Middleware
	r.Use(func(c *gin.Context) {
		// In real world, parse JWT. For now, assume User ID u1 if no auth
		c.Set("userId", "u1") 
		c.Next()
	})

	api := r.Group("/api")
	{
		api.POST("/auth/login", handlers.Login)
		
		api.GET("/events", handlers.GetEvents)
		api.POST("/events", handlers.CreateEvent)
		api.DELETE("/events/:id", handlers.DeleteEvent)
		
		api.GET("/notes", handlers.GetNotes)
		api.POST("/notes", handlers.CreateNote)
		api.PUT("/notes/:id", handlers.UpdateNote)
		api.DELETE("/notes/:id", handlers.DeleteNote)
	}

	log.Println("Server starting on :8080")
	r.Run(":8080")
}
