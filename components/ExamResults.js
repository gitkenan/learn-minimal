import Link from 'next/link';
import { Trash2 } from 'lucide-react';

export default function ExamResults({ examResults, onDelete }) {
  if (!examResults?.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        No exam results yet. Take your first exam!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {examResults.map((result) => (
        <div key={result.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <Link href={`/exam/results/${result.id}`}>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {result.subject}
                  </h3>
                  <div className="flex gap-3 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Difficulty:</span> {result.difficulty}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(result.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(result);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
