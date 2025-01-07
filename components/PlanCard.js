import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function PlanCard({ plan, onDelete }) {
  return (
    <div className="w-full bg-white rounded-lg shadow-sm mb-4">
      <Link href={`/plan/${plan.id}`}>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-medium text-gray-900">
              {plan.topic}
            </h2>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(plan);
              }}
              className="p-2 text-gray-400 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mb-3">
            Created {new Date(plan.created_at).toLocaleDateString()}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{plan.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${plan.progress}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}