import Link from 'next/link';
import { FaClipboardList } from 'react-icons/fa';

export default function ExamResults({ examResults }) {
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
        <div
          key={result.id}
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {result.subject}
              </h3>
              <div className="flex gap-3 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <span className="font-medium">Difficulty:</span> {result.difficulty}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Type:</span> {result.question_type}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(result.created_at).toLocaleDateString()}
              </div>
            </div>
            <Link
              href={`/exam/results/${result.id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <FaClipboardList />
              View Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
