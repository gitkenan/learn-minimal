import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const TaskNotes = ({ taskId, notes = [], onSaveNote, onDeleteNote }) => {
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

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

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    
    try {
      await onDeleteNote(noteToDelete.id);
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setNoteToDelete(null);
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
              className="bg-gray-50 p-3 rounded-lg relative group"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-gray-700 pr-8">{note.content}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-400">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
                <button
                  onClick={() => setNoteToDelete(note)}
                  className={`${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 text-gray-400 hover:text-red-500`}
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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

      {/* Delete Confirmation Bottom Sheet */}
      {noteToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
          onClick={() => setNoteToDelete(null)}
        >
          <div 
            className={`
              bg-white w-full md:w-96 rounded-t-lg md:rounded-lg p-4
              transform transition-transform duration-200 ease-out
              ${isMobile ? 'translate-y-0' : 'translate-y-0'}
            `}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Note</h3>
              <button
                onClick={() => setNoteToDelete(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setNoteToDelete(null)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                variant="destructive"
                size="sm"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskNotes;