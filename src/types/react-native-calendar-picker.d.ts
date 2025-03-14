declare module 'react-native-calendar-picker' {
  import { Component } from 'react';
  import { StyleProp, ViewStyle, TextStyle } from 'react-native';

  interface CalendarPickerProps {
    selectedStartDate?: Date;
    onDateChange?: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
    weekdays?: string[];
    months?: string[];
    previousTitle?: string;
    nextTitle?: string;
    selectedDayColor?: string;
    selectedDayTextColor?: string;
    todayBackgroundColor?: string;
    todayTextStyle?: StyleProp<TextStyle>;
    textStyle?: StyleProp<TextStyle>;
    customDatesStyles?: Array<{
      date: Date;
      style: StyleProp<ViewStyle>;
      textStyle: StyleProp<TextStyle>;
    }>;
    width?: number;
    height?: number;
    startFromMonday?: boolean;
    showDayStragglers?: boolean;
  }

  export default class CalendarPicker extends Component<CalendarPickerProps> {}
} 