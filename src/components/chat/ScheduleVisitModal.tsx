'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, X } from 'lucide-react';
import { useScheduleVisitMutation, useGetAvailableTimeSlotsQuery } from '@/lib/api/commonApi';

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  providerId: string;
  listingTitle: string;
}

export default function ScheduleVisitModal({
  isOpen,
  onClose,
  listingId,
  providerId,
  listingTitle,
}: ScheduleVisitModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [notes, setNotes] = useState('');

  const { data: availableSlots, isLoading: loadingSlots } = useGetAvailableTimeSlotsQuery(
    { providerId, date: selectedDate },
    { skip: !selectedDate }
  );

  const [scheduleVisit, { isLoading: isScheduling }] = useScheduleVisitMutation();

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Get max date (3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTimeSlot) {
      alert('Please select both date and time slot');
      return;
    }

    try {
      await scheduleVisit({
        listingId,
        scheduledDate: selectedDate,
        timeSlot: selectedTimeSlot,
        notes: notes.trim(),
      }).unwrap();

      alert('Visit scheduled successfully! The provider will confirm your request.');
      onClose();

      // Reset form
      setSelectedDate('');
      setSelectedTimeSlot('');
      setNotes('');
    } catch (error: any) {
      console.error('Error scheduling visit:', error);
      alert(error?.data?.error || 'Failed to schedule visit. Please try again.');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setSelectedDate('');
    setSelectedTimeSlot('');
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <Calendar className='w-5 h-5' />
            <span>Schedule Visit</span>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <h4 className='font-medium text-gray-900 mb-2'>{listingTitle}</h4>
            <p className='text-sm text-gray-600'>
              Schedule a visit to view this property. The provider will confirm your request.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Date Selection */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Select Date</label>
              <Input
                type='date'
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setSelectedTimeSlot(''); // Reset time slot when date changes
                }}
                min={minDate}
                max={maxDateStr}
                required
              />
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Available Time Slots
                </label>
                {loadingSlots ? (
                  <div className='text-sm text-gray-500'>Loading available slots...</div>
                ) : availableSlots?.data && availableSlots.data.length > 0 ? (
                  <div className='grid grid-cols-2 gap-2'>
                    {availableSlots.data.map((slot: string) => (
                      <Button
                        key={slot}
                        type='button'
                        variant={selectedTimeSlot === slot ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setSelectedTimeSlot(slot)}
                        className='justify-start'
                      >
                        <Clock className='w-4 h-4 mr-2' />
                        {slot}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className='text-sm text-gray-500'>
                    No available time slots for this date. Please select another date.
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='Any specific requirements or questions about the property...'
                rows={3}
                maxLength={500}
              />
              <div className='text-xs text-gray-500 mt-1'>{notes.length}/500 characters</div>
            </div>

            {/* Action Buttons */}
            <div className='flex space-x-3 pt-4'>
              <Button type='button' variant='outline' onClick={handleClose} className='flex-1'>
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={!selectedDate || !selectedTimeSlot || isScheduling}
                className='flex-1'
              >
                {isScheduling ? 'Scheduling...' : 'Schedule Visit'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
