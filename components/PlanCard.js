import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function PlanCard({ plan, onDelete }) {
  return (
    <div className="w-full card hover:transform hover:-translate-y-1 transition-all duration-200 mb-4">
      <Link href={`/plan/${plan.id}`}>
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-medium text-gray-900 gradient-text-primary">
              {plan.topic}
            </h2>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(plan);
              }}
              className="p-2 text-gray-400 hover:text-red-500 rounded-[4px] interactive"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mb-4">
            Created {new Date(plan.created_at).toLocaleDateString()}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-accent">{plan.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-[4px] h-2">
              <div
                className="bg-accent h-2 rounded-[4px] transition-all duration-300 ease-in-out"
                style={{ width: `${plan.progress}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
