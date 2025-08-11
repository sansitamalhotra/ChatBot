//frontend/src/Pages/Admin/BusinessHours/Forms/BusinessHoursModalForm.jsx
import React, { useState, useEffect } from 'react';
import API from '../../../../helpers/API';
import './BusinessHoursModalForm.css';

const BusinessHoursModalForm = ({ isOpen, onClose, onSuccess, editData, businessHoursId }) => {
  const [formData, setFormData] = useState({
    timezone: 'America/New_York',
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    outsideHoursMessage: "I'm sorry, but our live agents are currently unavailable. Our business hours are 9:00 AM - 6:00 PM EST, Monday through Friday.",
    outsideHoursOptions: [
      'Search for jobs',
      'Partnership information', 
      'Application help',
      'Leave a message for an agent'
    ],
    settings: {
      autoCloseChatsAfterHours: true,
      warningMinutesBeforeClose: 30,
      allowNewChatsMinutesBeforeClose: 15,
      weekendMessage: "We're currently closed for the weekend. Our business hours are Monday through Friday, 9:00 AM - 6:00 PM EST.",
      holidayMessage: "We're currently closed for the holiday. We'll be back during our regular business hours."
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London',
    'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
  ];

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        outsideHoursOptions: Array.isArray(editData.outsideHoursOptions) 
          ? editData.outsideHoursOptions 
          : []
      });
    }
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name === 'workingDays') {
      const updatedDays = checked 
        ? [...formData.workingDays, value]
        : formData.workingDays.filter(day => day !== value);
      setFormData(prev => ({ ...prev, workingDays: updatedDays }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...formData.outsideHoursOptions];
    updatedOptions[index] = value;
    setFormData(prev => ({ ...prev, outsideHoursOptions: updatedOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      outsideHoursOptions: [...prev.outsideHoursOptions, '']
    }));
  };

  const removeOption = (index) => {
    const updatedOptions = formData.outsideHoursOptions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, outsideHoursOptions: updatedOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = editData 
        ? await API.put(`/api/v1/businessHours/updateBusinessHours/${businessHoursId}`, formData)
        : await API.post('/api/v1/businessHours/addBusinessHours', formData);

      if (response.data && response.data.success) {
        onSuccess();
      } else {
        setError(response.data?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Error saving business hours:', err);
      setError('Error saving business hours: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? 'Update Business Hours' : 'Add Business Hours'}</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert alert-error mb-3">
              {error}
            </div>
          )}

          {/* Basic Settings */}
          <div className="form-section">
            <h4>Basic Settings</h4>
            
            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                required
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  name="workingHours.start"
                  value={formData.workingHours.start}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  name="workingHours.end"
                  value={formData.workingHours.end}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Working Days</label>
              <div className="checkbox-group">
                {daysOfWeek.map(day => (
                  <label key={day.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      name="workingDays"
                      value={day.value}
                      checked={formData.workingDays.includes(day.value)}
                      onChange={handleInputChange}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="form-section">
            <h4>Messages</h4>
            
            <div className="form-group">
              <label htmlFor="outsideHoursMessage">Outside Hours Message</label>
              <textarea
                id="outsideHoursMessage"
                name="outsideHoursMessage"
                value={formData.outsideHoursMessage}
                onChange={handleInputChange}
                rows="3"
                maxLength="1000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="weekendMessage">Weekend Message</label>
              <textarea
                id="weekendMessage"
                name="settings.weekendMessage"
                value={formData.settings.weekendMessage}
                onChange={handleInputChange}
                rows="2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="holidayMessage">Holiday Message</label>
              <textarea
                id="holidayMessage"
                name="settings.holidayMessage"
                value={formData.settings.holidayMessage}
                onChange={handleInputChange}
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Outside Hours Options</label>
              {formData.outsideHoursOptions.map((option, index) => (
                <div key={index} className="option-input">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder="Enter option text"
                    maxLength="100"
                  />
                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    onClick={() => removeOption(index)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={addOption}
              >
                <i className="fas fa-plus"></i> Add Option
              </button>
            </div>
          </div>

          {/* Chat Settings */}
          <div className="form-section">
            <h4>Chat Settings</h4>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="settings.autoCloseChatsAfterHours"
                  checked={formData.settings.autoCloseChatsAfterHours}
                  onChange={handleInputChange}
                />
                Auto-close chats after business hours
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="warningMinutes">Warning Minutes Before Close</label>
                <input
                  type="number"
                  id="warningMinutes"
                  name="settings.warningMinutesBeforeClose"
                  value={formData.settings.warningMinutesBeforeClose}
                  onChange={handleInputChange}
                  min="5"
                  max="120"
                />
              </div>
              <div className="form-group">
                <label htmlFor="newChatCutoff">New Chat Cutoff (minutes before close)</label>
                <input
                  type="number"
                  id="newChatCutoff"
                  name="settings.allowNewChatsMinutesBeforeClose"
                  value={formData.settings.allowNewChatsMinutesBeforeClose}
                  onChange={handleInputChange}
                  min="0"
                  max="60"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (editData ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// FIXED HolidayModal.jsx - This was the main issue
const HolidayModal = ({ isOpen, onClose, onSuccess, editData, businessHoursId }) => {
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    description: '',
    recurring: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editData && editData.index !== undefined) {
      setFormData({
        date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : '',
        name: editData.name || '',
        description: editData.description || '',
        recurring: editData.recurring || false
      });
    } else {
      // Reset form for new holiday
      setFormData({
        date: '',
        name: '',
        description: '',
        recurring: false
      });
    }
    // Clear any previous errors when modal opens/closes
    setError(null);
  }, [editData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Submitting holiday data:', formData); // Debug log

      if (editData && editData.index !== undefined) {
        // Update existing holiday
        console.log('Updating existing holiday at index:', editData.index);
        
        const response = await API.get(`/api/v1/businessHours/fetchBusinessHours`);
        if (response.data && response.data.success) {
          const businessHours = response.data.data.businessHours;
          
          // Update the specific holiday
          businessHours.holidays[editData.index] = {
            ...formData,
            date: new Date(formData.date)
          };
          
          // Use the update endpoint to save changes
          const updateResponse = await API.put(`/api/v1/businessHours/updateBusinessHours/${businessHoursId}`, businessHours);
          if (updateResponse.data && updateResponse.data.success) {
            console.log('Holiday updated successfully');
            onSuccess();
          } else {
            const errorMsg = updateResponse.data?.message || 'Failed to update holiday';
            console.error('Update failed:', errorMsg);
            setError(errorMsg);
          }
        } else {
          setError('Failed to fetch current business hours configuration');
        }
      } else {
        // Add new holiday - THE MAIN FIX IS HERE
        console.log('Adding new holiday with data:', {
          date: formData.date,
          name: formData.name,
          description: formData.description,
          recurring: formData.recurring
        });

        const response = await API.post('/api/v1/businessHours/addHoliday', {
          date: formData.date,
          name: formData.name,
          description: formData.description,
          recurring: formData.recurring
        });
        
        console.log('Add holiday response:', response.data);
        
        if (response.data && response.data.success) {
          console.log('Holiday added successfully');
          // Reset form after successful addition
          setFormData({
            date: '',
            name: '',
            description: '',
            recurring: false
          });
          onSuccess();
        } else {
          const errorMsg = response.data?.message || 'Failed to add holiday';
          console.error('Add holiday failed:', errorMsg);
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Error saving holiday:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError('Error saving holiday: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? 'Edit Holiday' : 'Add Holiday'}</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert alert-error mb-3">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="holidayDate">Date</label>
            <input
              type="date"
              id="holidayDate"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>

          <div className="form-group">
            <label htmlFor="holidayName">Holiday Name</label>
            <input
              type="text"
              id="holidayName"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              maxLength="100"
              required
              placeholder="e.g., Christmas Day, New Year's Day"
            />
          </div>

          <div className="form-group">
            <label htmlFor="holidayDescription">Description (Optional)</label>
            <textarea
              id="holidayDescription"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              maxLength="500"
              placeholder="Additional details about this holiday"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="recurring"
                checked={formData.recurring}
                onChange={handleInputChange}
              />
              Recurring Holiday (yearly)
            </label>
            <small>If checked, this holiday will repeat every year on the same date.</small>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (editData ? 'Update Holiday' : 'Add Holiday')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// SpecialHoursModal.jsx - Enhanced with better error handling
const SpecialHoursModal = ({ isOpen, onClose, onSuccess, editData, businessHoursId }) => {
  const [formData, setFormData] = useState({
    date: '',
    isClosed: false,
    hours: {
      start: '09:00',
      end: '18:00'
    },
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editData && editData.index !== undefined) {
      setFormData({
        date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : '',
        isClosed: editData.isClosed || false,
        hours: {
          start: editData.hours?.start || '09:00',
          end: editData.hours?.end || '18:00'
        },
        reason: editData.reason || ''
      });
    } else {
      setFormData({
        date: '',
        isClosed: false,
        hours: {
          start: '09:00',
          end: '18:00'
        },
        reason: ''
      });
    }
    setError(null);
  }, [editData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Submitting special hours data:', formData); // Debug log

      if (editData && editData.index !== undefined) {
        // Update existing special hours
        console.log('Updating existing special hours at index:', editData.index);
        
        const response = await API.get(`/api/v1/businessHours/fetchBusinessHours`);
        if (response.data && response.data.success) {
          const businessHours = response.data.data.businessHours;
          businessHours.specialHours[editData.index] = {
            ...formData,
            date: new Date(formData.date)
          };
          
          const updateResponse = await API.put(`/api/v1/businessHours/updateBusinessHours/${businessHoursId}`, businessHours);
          if (updateResponse.data && updateResponse.data.success) {
            console.log('Special hours updated successfully');
            onSuccess();
          } else {
            const errorMsg = updateResponse.data?.message || 'Failed to update special hours';
            console.error('Update failed:', errorMsg);
            setError(errorMsg);
          }
        }
      } else {
        // Add new special hours
        console.log('Adding new special hours');
        
        const response = await API.post('/api/v1/businessHours/addSpecialHours', formData);
        console.log('Add special hours response:', response.data);
        
        if (response.data && response.data.success) {
          console.log('Special hours added successfully');
          // Reset form after successful addition
          setFormData({
            date: '',
            isClosed: false,
            hours: {
              start: '09:00',
              end: '18:00'
            },
            reason: ''
          });
          onSuccess();
        } else {
          const errorMsg = response.data?.message || 'Failed to add special hours';
          console.error('Add special hours failed:', errorMsg);
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Error saving special hours:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError('Error saving special hours: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? 'Edit Special Hours' : 'Add Special Hours'}</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert alert-error mb-3">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="specialDate">Date</label>
            <input
              type="date"
              id="specialDate"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isClosed"
                checked={formData.isClosed}
                onChange={handleInputChange}
              />
              Closed on this date
            </label>
          </div>

          {!formData.isClosed && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="specialStartTime">Start Time</label>
                <input
                  type="time"
                  id="specialStartTime"
                  name="hours.start"
                  value={formData.hours.start}
                  onChange={handleInputChange}
                  required={!formData.isClosed}
                />
              </div>
              <div className="form-group">
                <label htmlFor="specialEndTime">End Time</label>
                <input
                  type="time"
                  id="specialEndTime"
                  name="hours.end"
                  value={formData.hours.end}
                  onChange={handleInputChange}
                  required={!formData.isClosed}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="specialReason">Reason (Optional)</label>
            <textarea
              id="specialReason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows="3"
              maxLength="200"
              placeholder="e.g., Company event, Maintenance, Extended hours for Black Friday"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (editData ? 'Update Special Hours' : 'Add Special Hours')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { BusinessHoursModalForm, HolidayModal, SpecialHoursModal };
export default BusinessHoursModalForm;
