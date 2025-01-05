import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, ChevronDown, ChevronUp } from 'lucide-react';

const TaskNotes = ({ taskId, notes = [], onSaveNote }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!newNote.trim()) return;
    
    try {
      setIsSaving(true);
      await onSaveNote(newNote);
      setNewNote('');
      setIsAddingNote(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (notes.length === 0 && !isAddingNote) {
    return (
      <button
        onClick={() => setIsAddingNote(true)}
        className="flex items-center text-xs text-gray-500 hover:text-accent mt-1 ml-6"
      >
        <MessageSquarePlus className="w-4 h-4 mr-1" />
        Add note
      </button>
    );
  }

  return (
    <div className="ml-6 mt-1">
      {(notes.length > 0 || isAddingNote) && (
        <div className="border-l-2 border-gray-200 pl-3">
          {/* Notes toggle */}
          {notes.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-xs text-gray-500 hover:text-accent mb-2"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 mr-1" />
              ) : (
                <ChevronDown className="w-4 h-4 mr-1" />
              )}
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </button>
          )}

          {/* Existing notes */}
          {isExpanded && (
            <div className="space-y-2 mb-2">
              {notes.map((note) => (
                <div 
                  key={note.id}
                  className="bg-gray-50 p-2 rounded text-sm text-gray-600"
                >
                  {note.content}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add note form */}
          {(isAddingNote || notes.length === 0) && (
            <div className="space-y-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="min-h-20 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !newNote.trim()}
                  size="sm"
                >
                  {isSaving ? 'Saving...' : 'Save Note'}
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Add note button */}
          {!isAddingNote && notes.length > 0 && (
            <button
              onClick={() => setIsAddingNote(true)}
              className="flex items-center text-xs text-gray-500 hover:text-accent mt-2"
            >
              <MessageSquarePlus className="w-4 h-4 mr-1" />
              Add another note
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskNotes;