
import React, { useState, useEffect } from 'react';
import { PrescriptionData, Medicine } from '../types';
import { BellIcon, PlusIcon } from './IconComponents';

interface PrescriptionResultProps {
  data: PrescriptionData;
}

const PrescriptionResult: React.FC<PrescriptionResultProps> = ({ data }) => {
  const [isSettingReminders, setIsSettingReminders] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);

  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState<Omit<Medicine, 'reminderTimes'>>({
      name: '', dosage: '', frequency: '', timing: '', reason: ''
  });

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    const h24 = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const label = `${h12}:${m} ${ampm}`;
    const value = `${h24}:${m}`;
    return { label, value };
  });

  useEffect(() => {
    const initialMedicines = data.medicines.map(med => {
      const storedReminders = localStorage.getItem(`reminders_${med.name}`);
      const reminderTimes = storedReminders ? JSON.parse(storedReminders) : Array(getFrequencyCount(med.frequency)).fill('');
      return { ...med, reminderTimes };
    });
    setMedicines(initialMedicines);
  }, [data]);

  useEffect(() => {
    const interval = setInterval(() => {
      const storedMedicines = medicines.filter(med => med.reminderTimes && med.reminderTimes.some(time => time !== ''));
      if (storedMedicines.length === 0 || notificationPermission !== 'granted') return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      storedMedicines.forEach(med => {
        med.reminderTimes?.forEach(time => {
          if (time === currentTime) {
            const lastNotifiedKey = `lastNotified_${med.name}_${time}`;
            const lastNotifiedDate = localStorage.getItem(lastNotifiedKey);
            const today = now.toISOString().split('T')[0];
            
            if (lastNotifiedDate !== today) {
              new Notification('Medication Reminder', {
                body: `Time to take your ${med.name} (${med.dosage}).`,
                icon: '/vite.svg' 
              });
              localStorage.setItem(lastNotifiedKey, today);
            }
          }
        });
      });
    }, 60000); 

    return () => clearInterval(interval);
  }, [medicines, notificationPermission]);

  const getFrequencyCount = (frequency: string): number => {
    const lowerFreq = frequency.toLowerCase();
    if (lowerFreq.includes('twice') || lowerFreq.includes('1-0-1') || lowerFreq.includes('0-1-1') || lowerFreq.includes('1-1-0') || lowerFreq.includes('bd')) return 2;
    if (lowerFreq.includes('thrice') || lowerFreq.includes('three') || lowerFreq.includes('1-1-1') || lowerFreq.includes('tds')) return 3;
    if (lowerFreq.includes('four') || lowerFreq.includes('1-1-1-1') || lowerFreq.includes('qds')) return 4;
    if (lowerFreq.includes('once') || lowerFreq.includes('1-0-0') || lowerFreq.includes('0-1-0') || lowerFreq.includes('0-0-1') || lowerFreq.includes('od')) return 1;
    return 1;
  };

  const generateTimeSlotLabels = (frequency: string, timing: string): string[] => {
    const freqCount = getFrequencyCount(frequency);
    const lowerTiming = timing.toLowerCase();
    const lowerFreq = frequency.toLowerCase();

    const isAfterFood = lowerTiming.includes('after');
    const isBeforeFood = lowerTiming.includes('before');
    const atBedtime = lowerTiming.includes('bedtime') || lowerTiming.includes('night');

    const getMealTimeLabel = (meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Bedtime'): string => {
        if (meal === 'Bedtime' || (freqCount === 1 && atBedtime)) return 'At Bedtime';
        if (isAfterFood) return `After ${meal}`;
        if (isBeforeFood) return `Before ${meal}`;
        return `${meal} Dose`;
    };
    
    if (freqCount === 1) {
        if (atBedtime) return ['At Bedtime'];
        if (lowerTiming.includes('breakfast')) return [getMealTimeLabel('Breakfast')];
        if (lowerTiming.includes('lunch')) return [getMealTimeLabel('Lunch')];
        if (lowerTiming.includes('dinner') || lowerTiming.includes('night')) return [getMealTimeLabel('Dinner')];
        return [`Daily Dose (${timing})`];
    }

    if (freqCount === 2) {
        if (lowerFreq.includes('1-0-1')) return [getMealTimeLabel('Breakfast'), getMealTimeLabel('Dinner')];
        if (lowerFreq.includes('1-1-0')) return [getMealTimeLabel('Breakfast'), getMealTimeLabel('Lunch')];
        if (lowerFreq.includes('0-1-1')) return [getMealTimeLabel('Lunch'), getMealTimeLabel('Dinner')];
        return [getMealTimeLabel('Breakfast'), getMealTimeLabel('Dinner')];
    }
    
    if (freqCount === 3) {
        return [getMealTimeLabel('Breakfast'), getMealTimeLabel('Lunch'), getMealTimeLabel('Dinner')];
    }

    if (freqCount === 4) {
         return [getMealTimeLabel('Breakfast'), getMealTimeLabel('Lunch'), getMealTimeLabel('Dinner'), getMealTimeLabel('Bedtime')];
    }

    return Array.from({ length: freqCount }, (_, i) => `Dose ${i + 1} (${timing})`);
  };
  
  const getFilteredTimeOptions = (label: string) => {
    const lowerLabel = label.toLowerCase();

    if (lowerLabel.includes('breakfast') || lowerLabel.includes('morning')) {
        return timeOptions.filter(opt => parseInt(opt.value.split(':')[0]) < 12);
    }
    if (lowerLabel.includes('lunch') || lowerLabel.includes('afternoon')) {
        return timeOptions.filter(opt => {
            const hour = parseInt(opt.value.split(':')[0]);
            return hour >= 12 && hour < 17;
        });
    }
    if (lowerLabel.includes('dinner') || lowerLabel.includes('evening') || lowerLabel.includes('night')) {
       return timeOptions.filter(opt => parseInt(opt.value.split(':')[0]) >= 17);
    }
    if (lowerLabel.includes('bedtime')) {
        return timeOptions.filter(opt => parseInt(opt.value.split(':')[0]) >= 20);
    }
    return timeOptions;
  };


  const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';
    const option = timeOptions.find(opt => opt.value === time24);
    return option ? option.label : '';
  };

  const handleTimeChange = (medIndex: number, timeIndex: number, value: string) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[medIndex].reminderTimes![timeIndex] = value;
    setMedicines(updatedMedicines);
    setReminderError(null);
  };

  const handleSaveReminders = async () => {
    setReminderError(null);

    for (const med of medicines) {
      const times = med.reminderTimes?.filter(t => t);
      if (!times || times.length <= 1) continue;
      
      const minGapHours = med.time_gap_hours || 4; // Default to 4 hours if not provided
      const minGapMinutes = minGapHours * 60;
      
      times.sort();

      for (let i = 0; i < times.length - 1; i++) {
        const time1 = new Date(`1970-01-01T${times[i]}`);
        const time2 = new Date(`1970-01-01T${times[i+1]}`);
        const diffMinutes = (time2.getTime() - time1.getTime()) / (1000 * 60);

        if (diffMinutes < minGapMinutes) {
          setReminderError(`Doses for ${med.name} are too close. Please ensure at least a ${minGapHours}-hour gap.`);
          return;
        }
      }
      
      // Also check the wrap-around gap (between last dose of the day and first of the next)
      if (times.length > 1) {
          const lastTime = new Date(`1970-01-02T${times[0]}`); // First dose on the next day
          const firstTime = new Date(`1970-01-01T${times[times.length - 1]}`); // Last dose on the current day
          const diffMinutes = (lastTime.getTime() - firstTime.getTime()) / (1000 * 60);
          if (diffMinutes < minGapMinutes) {
               setReminderError(`Doses for ${med.name} are too close. Please ensure at least a ${minGapHours}-hour gap.`);
               return;
          }
      }
    }

    if (notificationPermission !== 'granted') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        alert("Please enable notifications to receive reminders.");
        return;
      }
    }

    medicines.forEach(med => {
      if (med.reminderTimes && med.reminderTimes.some(t => t)) {
        localStorage.setItem(`reminders_${med.name}`, JSON.stringify(med.reminderTimes.filter(t => t)));
      } else {
        localStorage.removeItem(`reminders_${med.name}`);
      }
    });
    
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
    setIsSettingReminders(false);
  };

  const handleAddNewMedicine = () => {
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.frequency || !newMedicine.timing) {
      alert("Please fill in all required fields for the new medicine.");
      return;
    }
    const newMedWithReminders: Medicine = {
      ...newMedicine,
      reminderTimes: Array(getFrequencyCount(newMedicine.frequency)).fill('')
    };
    setMedicines([...medicines, newMedWithReminders]);
    setNewMedicine({ name: '', dosage: '', frequency: '', timing: '', reason: '' });
    setIsAddingMedicine(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-surface dark:bg-darkSurface rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 animate-fade-in relative">
      <h2 className="text-2xl font-bold text-primary-dark mb-4">Prescription Analysis</h2>
      
      <div className="bg-primary/10 p-4 rounded-lg mb-6">
        <p className="text-md font-semibold text-secondary dark:text-darkHeading">Diagnosis:</p>
        <p className="text-xl text-primary-dark">{data.disease || 'Not specified'}</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-secondary dark:text-darkHeading">Medication Schedule</h3>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsAddingMedicine(!isAddingMedicine)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                >
                <PlusIcon className="w-5 h-5 mr-1" />
                Add Medicine
            </button>
            <button 
                onClick={() => setIsSettingReminders(!isSettingReminders)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-orange-700 transition-colors"
            >
                <BellIcon className="w-5 h-5 mr-2" />
                {isSettingReminders ? 'Cancel' : 'Set Reminders'}
            </button>
        </div>
      </div>
      
      {isAddingMedicine && (
        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg shadow-inner mb-4 space-y-4 animate-fade-in">
            <h4 className="font-semibold text-secondary dark:text-darkHeading">Add New Medicine</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Medicine Name*" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"/>
                <input type="text" placeholder="Dosage (e.g., 500mg)*" value={newMedicine.dosage} onChange={e => setNewMedicine({...newMedicine, dosage: e.target.value})} className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"/>
                <input type="text" placeholder="Frequency (e.g., Twice a day)*" value={newMedicine.frequency} onChange={e => setNewMedicine({...newMedicine, frequency: e.target.value})} className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"/>
                <input type="text" placeholder="Timing (e.g., After food)*" value={newMedicine.timing} onChange={e => setNewMedicine({...newMedicine, timing: e.target.value})} className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"/>
            </div>
            <input type="text" placeholder="Reason (e.g., For fever) (Optional)" value={newMedicine.reason} onChange={e => setNewMedicine({...newMedicine, reason: e.target.value})} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"/>
            <div className="flex justify-end gap-2">
                <button onClick={() => setIsAddingMedicine(false)} className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
                <button onClick={handleAddNewMedicine} className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-primary hover:bg-primary-dark">Save Medicine</button>
            </div>
        </div>
      )}

      <div className="space-y-4">
        {medicines.map((med, index) => (
          <div key={`${med.name}-${index}`} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-100 dark:border-slate-700 transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                <div>
                    <p className="text-lg font-bold text-primary">{med.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{med.dosage}</p>
                    {med.reason && (
                        <p className="text-sm text-secondary dark:text-slate-300 mt-1">
                            <span className="font-semibold">For:</span> {med.reason}
                        </p>
                    )}
                    {!isSettingReminders && med.reminderTimes && med.reminderTimes.some(t => t) && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                            <BellIcon className="w-4 h-4" />
                            <span>Reminders set for: {med.reminderTimes.filter(t => t).map(formatTime12Hour).join(', ')}</span>
                        </div>
                    )}
                </div>
                <div className="mt-2 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-secondary dark:text-darkHeading">{med.frequency}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{med.timing}</p>
                </div>
            </div>
            {isSettingReminders && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  {generateTimeSlotLabels(med.frequency, med.timing).map((label, timeIndex) => {
                    const filteredOptions = getFilteredTimeOptions(label);
                    return (
                        <div key={timeIndex}>
                            <label htmlFor={`time-${index}-${timeIndex}`} className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">{label}</label>
                            <select
                                id={`time-${index}-${timeIndex}`}
                                value={med.reminderTimes?.[timeIndex] || ''}
                                onChange={(e) => handleTimeChange(index, timeIndex, e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-slate-500 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                            >
                                <option value="">-- Select Time --</option>
                                {filteredOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {isSettingReminders && (
        <div className="mt-6 text-center">
           {reminderError && (
            <p className="text-red-500 text-sm mb-4">{reminderError}</p>
          )}
          <button
            onClick={handleSaveReminders}
            className="w-full sm:w-auto text-white bg-primary hover:bg-primary-dark font-medium rounded-lg text-md px-8 py-3 transition-all duration-300"
          >
            Save Reminders
          </button>
        </div>
      )}

      {showConfirmation && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          Reminders saved successfully!
        </div>
      )}
    </div>
  );
};

export default PrescriptionResult;