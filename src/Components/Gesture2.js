import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, StyleSheet, Text, ScrollView} from 'react-native';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated';
import {clamp} from 'react-native-redash';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '../config';
import moment from 'moment';

const CARD_WIDTH = 100;
const CARD_HEIGHT = 80;
const today = moment();

export default () => {
  const translateX = useSharedValue(100);
  const translateY = useSharedValue(200);
  const indexCalendar = useSharedValue(0);
  const boundX = SCREEN_WIDTH - CARD_WIDTH;
  const boundY = SCREEN_HEIGHT - CARD_HEIGHT;
  const text = useSharedValue(null);

  const [stateText, setStateText] = useState('h');

  const [layout, setLayout] = useState([]);

  const [calendar, setCalendar] = useState([]);
  const isActive = useSharedValue(false);

  console.log('calendarcalendar', JSON.stringify(calendar, null, 2));

  const sessionName = [
    'Back',
    'Chest',
    'Arm',
    'Back Chest',
    'Legs',
    'Shoulder',
  ];

  useEffect(() => {
    setCalendar(
      new Array(7).fill().map((_, i) => {
        const date = today.clone().add(1 * i, 'days');
        return {
          id: date.unix(),
          date: date.format('DD MMMM YYY'),
          session: Array(i)
            .fill()
            .map((_, index) => {
              return {
                name: sessionName[index],
                id: index,
              };
            }),
        };
      }),
    );
  }, []);

  const settingText = date => {
    setStateText(date);
  };

  const onDrop = useCallback(
    event => {
      'worklet';
      const sd = Object.values(layout).findIndex(
        item =>
          translateY.value > item.y - CARD_HEIGHT / 2 &&
          translateY.value < item.y - CARD_HEIGHT / 2 + item.height,
      );
      if (!isActive.value) {
        translateY.value = layout[sd] ? layout[sd].y + 10 : translateY.value;
        translateX.value = layout[sd]
          ? SCREEN_WIDTH / 2 - CARD_WIDTH / 2
          : translateX.value;
      }
      runOnJS(settingText)(calendar && calendar[sd] ? calendar[sd].date : null);
    },
    [layout, calendar, isActive.value, translateY, translateX],
  );

  const onGestureEvent = useAnimatedGestureHandler({
    onStart: (event, ctx) => {
      ctx.offsetX = translateX.value;
      ctx.offsetY = translateY.value;
    },
    onActive: (event, ctx) => {
      isActive.value = true;
      translateX.value = clamp(ctx.offsetX + event.translationX, 0, boundX);
      translateY.value = clamp(ctx.offsetY + event.translationY, 0, boundY);
      onDrop(event);
    },
    onEnd: (event, ctx) => {
      isActive.value = false;
      onDrop(event);
    },
  });

  const style = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
      ],
    };
  });

  //   const sessions = useMemo(() => {
  //    if(calendar && calendar.length) {
  //        calendar.map(day => )
  //    }
  //   }, [calendar]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {calendar.map((day, index) => (
        <Calendar
          key={day.date}
          day={day}
          setLayout={setLayout}
          index={index}
          layout={layout}
          translateY={translateY}
          translateX={translateX}
          isActive={isActive}
        />
      ))}

      {calendar.map((day, index) => (
        <CalendarRow />
      ))}

      <PanGestureHandler {...{onGestureEvent}}>
        <Animated.View {...{style}}>
          <View style={styles.box}>
            <Text>{stateText}</Text>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </ScrollView>
  );
};

const CalendarRow = () => {
  return <Text>dd</Text>;
};

const Calendar = ({
  day,
  setLayout,
  translateY,
  translateX,
  index,
  layout,
  isActive,
}) => {
  const backgroundColor = useAnimatedStyle(() => {
    if (
      layout[index] &&
      translateY.value > layout[index].y - CARD_HEIGHT / 2 &&
      translateY.value <
        layout[index].y - CARD_HEIGHT / 2 + layout[index].height &&
      isActive.value
    ) {
      return {
        backgroundColor: 'rgb(23,23,23)',
        width: SCREEN_WIDTH,
        height: 100,
        marginBottom: 20,
      };
    } else {
      return {
        backgroundColor: 'rgba(255, 105, 180, 1)',
        width: SCREEN_WIDTH,
        height: 100,
        marginBottom: 20,
      };
    }
  });

  return (
    <Animated.View
      onLayout={({nativeEvent}) =>
        setLayout(prevState => ({...prevState, [index]: nativeEvent.layout}))
      }
      {...{style: backgroundColor}}>
      <Text>{day.date}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {},
  box: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'red',
    borderRadius: 10,
  },
  dropZone: {
    backgroundColor: 'gray',
  },
});
