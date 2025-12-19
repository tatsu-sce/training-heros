import React from 'react';
import Modal from '../ui/Modal';
import ScheduleEditor from './ScheduleEditor';

const ScheduleModal = ({ isOpen, onClose, onScheduleUpdate }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Available Time">
            <ScheduleEditor onScheduleUpdate={onScheduleUpdate} />
        </Modal>
    );
};

export default ScheduleModal;
