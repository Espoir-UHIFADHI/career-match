import React from 'react';
import { Modal } from './ui/Modal';
import { Play } from 'lucide-react';

interface DemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Démo de Career Match"
            className="sm:max-w-4xl"
        >
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-900 group cursor-pointer">
                {/* Placeholder for actual video implementation */}
                {/* You can replace this logic with an iframe or video tag */}

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/20">
                        <Play className="w-8 h-8 text-white fill-current ml-1" />
                    </div>
                </div>

                {/* Placeholder Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none">
                    <p className="text-white font-medium text-lg">Regarder comment optimiser votre CV en 2 minutes</p>
                    <p className="text-slate-300 text-sm mt-2">Démonstration vidéo à venir</p>
                </div>
            </div>
        </Modal>
    );
}
