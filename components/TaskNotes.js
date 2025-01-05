import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, ChevronDown, ChevronUp } from 'lucide-react';

const TaskNotes = ({ taskId, notes = [], onSaveNote }) => {
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = async () => {
    if (!newNote.trim()) return;
    
    try {
      setIsSaving(true);
      await onSaveNote(newNote);
      setNewNote('');
      setIsAddingNote(false);
      setIsExpanded(true);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Only render add note button if there are no notes and we're not currently adding one
  const showAddNoteButton = !isAddingNote && !notes.length;

  return (
    <div className="mt-2">
      {/* Note count and toggle - only show if there are notes */}
      {notes.length > 0 && !isAddingNote && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
        </button>
      )}

      {/* Add note button - in margin */}
      {showAddNoteButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsAddingNote(true);
          }}
          className="ml-2 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200"
          title="Add note"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Add note</span>
        </button>
      )}

      {/* Expanded notes view */}
      {isExpanded && notes.length > 0 && (
        <div className="ml-6 mt-2 space-y-3">
          {notes.map((note) => (
            <div 
              key={note.id} 
              className="bg-gray-50 p-3 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-gray-700">{note.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          
          {/* Add another note button */}
          {!isAddingNote && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingNote(true);
              }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <MessageSquarePlus className="w-3 h-3" />
              <span>Add another note</span>
            </button>
          )}
        </div>
      )}

      {/* Add note form */}
      {isAddingNote && (
        <div 
          className="ml-6 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="text-sm mb-2"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !newNote.trim()}
              size="sm"
            >
              {isSaving ? 'Saving...' : 'Save'}
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
    </div>
  );
};

export default TaskNotes;