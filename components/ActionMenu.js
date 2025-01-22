import { useState, useRef, useEffect } from 'react';
import { FaEllipsisV, FaGraduationCap, FaComments } from 'react-icons/fa';
import { MessageSquarePlus, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function ActionMenu({ onExam, onChat, onAddNote, onAddToCalendar, label = '' }) {
 	const [isOpen, setIsOpen] = useState(false);
 	const [showCalendarPicker, setShowCalendarPicker] = useState(false);
 	const [selectedDate, setSelectedDate] = useState('');
 	const menuRef = useRef(null);
 	const isMobile = useMediaQuery('(max-width: 768px)');

	useEffect(() => {
		function handleClickOutside(event) {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleChatClick = () => {
		onChat();
		setIsOpen(false);
	};

	return (
		<div className="relative inline-flex items-center h-6" ref={menuRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors duration-200"
				aria-label="More actions"
			>
				<FaEllipsisV className="w-3.5 h-3.5 text-gray-500" />
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
					<button
						onClick={() => {
							onExam();
							setIsOpen(false);
						}}
						className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
					>
						<FaGraduationCap className="w-4 h-4" />
						<span>Test {label}</span>
					</button>
					<button
						onClick={handleChatClick}
						className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
					>
						<FaComments className="w-4 h-4" />
						<span>Chat about {label}</span>
					</button>
					{onAddNote && (
						<button
							onClick={() => {
								onAddNote();
								setIsOpen(false);
							}}
							className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
						>
							<MessageSquarePlus className="w-4 h-4" />
							<span>Add note</span>
						</button>
					)}
					<button
						onClick={() => {
							setShowCalendarPicker(true);
							setIsOpen(false);
						}}
						className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-7 8H5m14 0h-6m2 9h6M4 11h16M4 19h16M4 15h16" />
						</svg>
						<span>Add to Calendar</span>
					</button>
				</div>
			)}

			{showCalendarPicker && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
					onClick={() => setShowCalendarPicker(false)}>
					<div className="bg-white w-full md:w-96 rounded-t-lg md:rounded-lg p-4 transform transition-transform duration-200 ease-out"
						onClick={(e) => e.stopPropagation()}>
						<div className="flex justify-between items-start mb-4">
							<h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
							<button
								onClick={() => setShowCalendarPicker(false)}
								className="text-gray-400 hover:text-gray-500"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<input
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="w-full px-3 py-2 border rounded-lg mb-4"
							min={new Date().toISOString().split('T')[0]}
						/>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setShowCalendarPicker(false)}
								className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
							>
								Cancel
							</button>
							<button
								onClick={() => {
									if (selectedDate && onAddToCalendar) {
										onAddToCalendar(selectedDate);
										setShowCalendarPicker(false);
									}
								}}
								className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg"
								disabled={!selectedDate}
							>
								Confirm
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}