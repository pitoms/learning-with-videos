"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, FileText, List, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const chapters = [
  { id: 1, title: "Introduction", duration: "5:24", completed: true },
  { id: 2, title: "Setting Up Your Environment", duration: "8:15", completed: true },
  { id: 3, title: "Core Concepts", duration: "12:30", completed: false, current: true },
  { id: 4, title: "Practical Examples", duration: "15:45", completed: false },
  { id: 5, title: "Best Practices", duration: "10:20", completed: false },
  { id: 6, title: "Summary & Next Steps", duration: "6:10", completed: false },
]

const transcriptSegments = [
  { time: "0:00", text: "Welcome to this comprehensive course on advanced web development." },
  {
    time: "0:15",
    text: "In this lesson, we'll explore the fundamental concepts that will help you build modern web applications.",
  },
  { time: "0:35", text: "We'll start with the basics and gradually move towards more complex topics." },
  { time: "0:52", text: "Make sure to follow along and practice the examples provided." },
]

export function VideoSidebar() {
  const [notes, setNotes] = useState("")
  const courseProgress = 33

  return (
    <div className="w-full lg:w-[420px] border-l border-border bg-card">
      <div className="p-4 lg:p-6 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-card-foreground">Course Progress</h2>
          <span className="text-sm font-medium text-primary">{courseProgress}%</span>
        </div>
        <Progress value={courseProgress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">2 of 6 chapters completed</p>
      </div>

      <Tabs defaultValue="chapters" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 lg:px-6 h-12">
          <TabsTrigger
            value="chapters"
            className="gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Chapters</span>
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger
            value="transcript"
            className="gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Transcript</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="chapters"
          className="mt-0 p-4 lg:p-6 space-y-2 max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-240px)] overflow-y-auto"
        >
          {chapters.map((chapter) => (
            <Card
              key={chapter.id}
              className={cn(
                "p-4 cursor-pointer transition-colors hover:bg-accent",
                chapter.current && "bg-accent border-primary",
              )}
            >
              <div className="flex items-start gap-3">
                {chapter.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-card-foreground text-balance">{chapter.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{chapter.duration}</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent
          value="notes"
          className="mt-0 p-4 lg:p-6 max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-240px)] overflow-y-auto"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-card-foreground mb-2">Your Notes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Take notes while watching to help remember key concepts
              </p>
            </div>
            <Textarea
              placeholder="Type your notes here..."
              className="min-h-[300px] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button className="w-full">Save Notes</Button>
          </div>
        </TabsContent>

        <TabsContent
          value="transcript"
          className="mt-0 p-4 lg:p-6 space-y-4 max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-240px)] overflow-y-auto"
        >
          {transcriptSegments.map((segment, index) => (
            <div
              key={index}
              className="flex gap-3 group cursor-pointer hover:bg-accent p-2 rounded-md -mx-2 transition-colors"
            >
              <span className="text-xs font-mono text-primary font-medium flex-shrink-0 mt-0.5">{segment.time}</span>
              <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                {segment.text}
              </p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
