import { useState, useRef, useEffect } from 'react';
import { FaEllipsisV, FaGraduationCap, FaComments } from 'react-icons/fa';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function ActionMenu({ onExam, onChat, label = '' }) {
	const [isOpen, setIsOpen] = useState(false);
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
				</div>
			)}
		</div>
	);
}