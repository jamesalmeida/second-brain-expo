import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment-timezone';

const EventEditModal = ({ 
  isVisible, 
  onClose, 
  event, 
  isDarkMode,
  timezone 
}) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setLocation(event.location || '');
      setStartDate(new Date(event.startDate));
      setEndDate(new Date(event.endDate));
      setIsAllDay(event.allDay || false);
    }
  }, [event]);

  const handleSave = async () => {
    try {
      await Calendar.updateEventAsync(event.id, {
        title,
        location,
        startDate,
        endDate,
        allDay: isAllDay,
        timeZone: timezone
      });
      onClose(true); // true indicates successful update
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
      console.error('Error updating event:', error);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Calendar.deleteEventAsync(event.id);
              onClose(true); // true indicates successful deletion
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
              console.error('Error deleting event:', error);
            }
          }
        }
      ]
    );
  };

  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
  const textColor = isDarkMode ? 'white' : 'black';

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => onClose(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => onClose(false)}>
              <Text style={[styles.headerButton, { color: '#007AFF' }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>Edit Event</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.headerButton, { color: '#007AFF' }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: isDarkMode ? '#333' : '#ddd' }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
            />

            <TextInput
              style={[styles.input, { color: textColor, borderColor: isDarkMode ? '#333' : '#ddd' }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Location"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
            />

            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: textColor }]}>All-day</Text>
              <Switch
                value={isAllDay}
                onValueChange={setIsAllDay}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isAllDay ? '#007AFF' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={[styles.dateLabel, { color: textColor }]}>Starts</Text>
              <Text style={[styles.dateValue, { color: '#007AFF' }]}>
                {moment(startDate).format(isAllDay ? 'LL' : 'LLL')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={[styles.dateLabel, { color: textColor }]}>Ends</Text>
              <Text style={[styles.dateValue, { color: '#007AFF' }]}>
                {moment(endDate).format(isAllDay ? 'LL' : 'LLL')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: '#ff3b30' }]}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Event</Text>
            </TouchableOpacity>
          </ScrollView>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode={isAllDay ? 'date' : 'datetime'}
              is24Hour={true}
              onChange={(event, date) => {
                setShowStartPicker(false);
                if (date) setStartDate(date);
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode={isAllDay ? 'date' : 'datetime'}
              is24Hour={true}
              onChange={(event, date) => {
                setShowEndPicker(false);
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerButton: {
    fontSize: 17,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  dateButton: {
    padding: 12,
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventEditModal;