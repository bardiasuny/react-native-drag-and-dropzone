import React, {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {View, StyleSheet, Text, ScrollView} from 'react-native';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  interpolateColors,
} from 'react-native-reanimated';
import {clamp} from 'react-native-redash';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '../config';
import moment from 'moment';
import {get, isEqual, keys, parseInt, values} from 'lodash';
import {
  CALENDAR_BACKGROUND,
  CALENDAR_ACTIVE_BACKGROUND,
  CARD_BACKGROUND,
  LIGHT_TEXT,
  DARK_TEXT,
} from '../../../Animation/src/COLORS.js';

const CARD_WIDTH = 100;
const CARD_WIDTH_PADDING = 100 + 10;

const CARD_HEIGHT = 50;
const today = moment();
const boundX = SCREEN_WIDTH - CARD_WIDTH;
const boundY = SCREEN_HEIGHT - CARD_HEIGHT;

export default () => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const activeTranslateX = useSharedValue(SCREEN_WIDTH);
  const activeTranslateY = useSharedValue(0);

  const isActiveGlobal = useSharedValue(false);

  const indexCalendar = useSharedValue(0);

  const text = useSharedValue(null);

  const [stateText, setStateText] = useState('h');

  const [layout, setLayout] = useState([]);
  const layoutUI = useSharedValue({});

  const [calendar, setCalendar] = useState([]);
  const isActive = useSharedValue(false);

  // console.log('calendarcalendar', JSON.stringify(calendar, null, 2));

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
          date: date.format('ddd - DD MMMM YY'),
          session: Array(i)
            .fill()
            .map((_, index) => {
              return {
                name: sessionName[index],
                id: `${i}-${index}-${sessionName[index]}`,
                rowIndex: i,
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
          activeTranslateX.value > item.y - CARD_HEIGHT / 2 &&
          activeTranslateX.value < item.y - CARD_HEIGHT / 2 + item.height,
      );
      if (!isActive.value) {
        activeTranslateX.value = layout[sd]
          ? layout[sd].y + 10
          : activeTranslateX.value;
        activeTranslateY.value = layout[sd]
          ? SCREEN_WIDTH / 2 - CARD_WIDTH / 2
          : translateX.value;
      }
      runOnJS(settingText)(calendar && calendar[sd] ? calendar[sd].date : null);
    },
    [layout, calendar, isActive.value, translateY, translateX],
  );

  const scrollTranslateX = useSharedValue(0);
  const scrollTranslateY = useSharedValue(0);
  const isScrollActive = useSharedValue(false);

  const onCalendarGesture = useAnimatedGestureHandler({
    onStart: (event, ctx) => {
      ctx.offsetX = scrollTranslateX.value;
      ctx.offsetY = scrollTranslateY.value;
    },
    onActive: (event, ctx) => {
      isScrollActive.value = true;
      scrollTranslateX.value = ctx.offsetX + event.translationX;
      scrollTranslateY.value = event.absoluteY;
    },
    onEnd: (event, ctx) => {
      isScrollActive.value = false;
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

  const activeRowIndex = useSharedValue(0);
  const activeSessionIndex = useSharedValue(0);

  console.log('activeRowIndex', activeRowIndex.value, activeSessionIndex.value);

  const onStartDrag = (rowIndex, sessionIndex) => {
    console.log(
      'activeRowIndex',
      get(calendar, `${rowIndex}.session.${sessionIndex}`),
    );
    setActiveRowIndex(rowIndex);
    setActiveSessionIndex(sessionIndex);
  };

  const setTheCalendar = (newCalendar, sd) => {
    newCalendar[sd] &&
      newCalendar[sd].session &&
      newCalendar[sd].session.push(
        calendar[activeRowIndex.value].session[activeSessionIndex.value],
      );
    newCalendar[activeRowIndex.value].session.splice(
      activeSessionIndex.value,
      1,
    );
    setCalendar(newCalendar);
  };

  const onDropSession = useCallback(
    (event, sd) => {
      'worklet';

      if (
        (!isActiveGlobal.value &&
          activeSessionIndex.value &&
          activeRowIndex.value,
        sd)
      ) {
        const newCalendar = [...calendar];

        if (parseInt(sd) > -1) {
          runOnJS(setTheCalendar)(newCalendar, sd);
        } else {
          runOnJS(setTheCalendar)(newCalendar, activeRowIndex.value);
        }
      }
      //runOnJS(settingText)(calendar && calendar[sd] ? calendar[sd].date : null);
      //runOnJS(onStartDrag)(null, null)
    },
    [layout, calendar, isActive.value, translateY, translateX],
  );

  //   const sessions = useMemo(() => {
  //    if(calendar && calendar.length) {
  //        calendar.map(day => )
  //    }
  //   }, [calendar]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {calendar.map((day, index) => (
        <CalendarRow
          key={day.id}
          day={day}
          setLayout={setLayout}
          layoutUI={layoutUI}
          index={index}
          layout={layout}
          translateY={translateY}
          translateX={translateX}
          isActive={isActive}
          activeTranslateX={activeTranslateX}
          activeTranslateY={activeTranslateY}
          isActiveGlobal={isActiveGlobal}
          onCalendarGesture={onCalendarGesture}
          activeRowIndex={activeRowIndex}
          activeSessionIndex={activeSessionIndex}
        />
      ))}

      {calendar.map((day, index) => (
        <Fragment key={day.id}>
          {!!day.session &&
            !!day.session.length &&
            day.session.map((sess, i) => (
              <SessionCards
                key={sess.id}
                day={day}
                sess={sess}
                rowIndex={index}
                layout={layout}
                layoutUI={layoutUI}
                sessionIndex={i}
                activeTranslateX={activeTranslateX}
                activeTranslateY={activeTranslateY}
                isActiveGlobal={isActiveGlobal}
                scrollTranslateX={scrollTranslateX}
                scrollTranslateY={scrollTranslateY}
                isScrollActive={isScrollActive}
                onStartDrag={onStartDrag}
                onDropSession={onDropSession}
                activeRowIndex={activeRowIndex}
                activeSessionIndex={activeSessionIndex}
              />
            ))}
        </Fragment>
      ))}

      {/* <PanGestureHandler {...{onGestureEvent}}>
        <Animated.View {...{style}}>
          <View style={styles.box}>
            <Text>{stateText}</Text>
          </View>
        </Animated.View>
      </PanGestureHandler> */}
    </ScrollView>
  );
};

const SessionCards = ({
  day,
  sess,
  rowIndex,
  layout,
  layoutUI,
  sessionIndex,
  activeTranslateX,
  activeTranslateY,
  isActiveGlobal,
  scrollTranslateX,
  scrollTranslateY,
  isScrollActive,
  onStartDrag,
  onDropSession,
  activeRowIndex,
  activeSessionIndex,
}) => {
  const isActive = useSharedValue(false);
  const translateX = useSharedValue(get(layout, `${[rowIndex]}.x`, 0));
  const translateY = useSharedValue(get(layout, `${[rowIndex]}.y`, 0));

  const [thisLayoutX] = useState(get(layout, `${[rowIndex]}.x`, 0));
  const [thisLayoutY] = useState(get(layout, `${[rowIndex]}.y`, 0));
  const thisLayoutHeight = get(layout, `${[rowIndex]}.height`, 0);

  const opacityOndrop = useSharedValue(0);

  // useEffect(() => {
  //   if (sessionIndex === activeSessionIndex.value) {
  //     (translateX.value = thisLayoutX + CARD_WIDTH_PADDING * sessionIndex + 10),
  //       (translateY.value = withTiming(get(layout, `${[rowIndex]}.y`, 0) + 38));
  //   }
  // }, [layout, rowIndex, sessionIndex, translateX, translateY]);
  const firstLAyour = useSharedValue(true);
  useLayoutEffect(() => {
    'worklet';
    if (values(layout).length > 0 && rowIndex) {
      opacityOndrop.value = 1;
      firstLAyour.value = false;

      if (rowIndex !== activeRowIndex.value || isActive.value) {
        translateX.value = activeTranslateX.value;
        translateY.value = activeTranslateY.value;
      }

      translateX.value = withTiming(
        thisLayoutX + CARD_WIDTH_PADDING * sessionIndex + 10,
      );

      translateY.value = withTiming(get(layout, `${[rowIndex]}.y`, 0) + 38);
    }
  }, [
    get(layout, `${[rowIndex]}.x`),
    get(layout, `${[rowIndex]}.y`),
    sessionIndex,
    isActive.value,
  ]);

  useDerivedValue(() => {
    console.log('layoutUIlayoutUI', layoutUI);
    // if (Object.values(layoutUI.value).length > 0 && rowIndex) {
    //   opacityOndrop.value = 1;
    //   firstLAyour.value = false;

    //   if (rowIndex !== activeRowIndex.value || isActive.value) {
    //     translateX.value = activeTranslateX.value;
    //     translateY.value = activeTranslateY.value;
    //   }

    //   translateX.value = withTiming(
    //     thisLayoutX + CARD_WIDTH_PADDING * sessionIndex + 10,
    //   );

    //   const layoutY =
    //     layoutUI.value && layoutUI.value[rowIndex] && layoutUI.value[rowIndex].y
    //       ? layoutUI.value[rowIndex].y
    //       : 0;

    //   translateY.value = withTiming(layoutY + 38);
    // }
    if (
      sessionIndex > activeSessionIndex.value &&
      rowIndex === activeRowIndex.value &&
      isActiveGlobal.value &&
      !isActive.value
    ) {
      translateX.value = withTiming(
        thisLayoutX +
          CARD_WIDTH_PADDING * sessionIndex +
          10 -
          CARD_WIDTH_PADDING,
      );
    }
    if (
      scrollTranslateY.value > thisLayoutY &&
      scrollTranslateY.value < thisLayoutY + thisLayoutHeight &&
      isActive.value
    ) {
      translateX.value =
        thisLayoutX +
        CARD_WIDTH_PADDING * sessionIndex +
        10 +
        scrollTranslateX.value;
    }
  });

  const onGestureEvent = useAnimatedGestureHandler({
    onStart: (event, ctx) => {
      //opacityOndrop.value = 1;
      ctx.offsetX = translateX.value;
      ctx.offsetY = translateY.value;
      activeTranslateX.value = translateX.value;
      activeTranslateY.value = translateY.value;
      //runOnJS(onStartDrag)(rowIndex, sessionIndex)
      activeRowIndex.value = rowIndex;
      activeSessionIndex.value = sessionIndex;
    },
    onActive: (event, ctx) => {
      isActive.value = true;
      isActiveGlobal.value = true;
      translateX.value = clamp(ctx.offsetX + event.translationX, 0, boundX);
      translateY.value = clamp(ctx.offsetY + event.translationY, 0, boundY);
      //onDrop(event);
      activeTranslateX.value = translateX.value;
      activeTranslateY.value = translateY.value;
    },
    onEnd: (event, ctx) => {
      isActiveGlobal.value = false;
      isActive.value = false;
      translateX.value =
        layout[rowIndex].x + CARD_WIDTH_PADDING * sessionIndex + 10;

      translateY.value = layout[rowIndex].y + 38;

      const sd = Object.values(layout).findIndex(
        item =>
          activeTranslateY.value > item.y - CARD_HEIGHT / 2 &&
          activeTranslateY.value < item.y - CARD_HEIGHT / 2 + item.height,
      );

      if (parseInt(sd) > -1) {
        //console.log('sdsdsdsd', parseInt(sd));
        translateX.value = activeTranslateX.value;
        translateY.value = activeTranslateY.value;
      } else {
        opacityOndrop.value = 0;
      }
      onDropSession(event, sd);
    },
  });
  const style = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      zIndex: isActive.value ? 100 : 10,
      opacity: opacityOndrop.value,
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
      ],
    };
  });
  return (
    <>
      <PanGestureHandler {...{onGestureEvent}}>
        <Animated.View {...{style}}>
          <View style={styles.box}>
            <Text style={styles.cardText}>{sess.name}</Text>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
};

const CalendarRow = ({
  day,
  setLayout,
  layoutUI,
  translateY,
  translateX,
  index,
  layout,
  isActive,
  activeTranslateX,
  activeTranslateY,
  isActiveGlobal,
  onCalendarGesture,
  activeRowIndex,
}) => {
  const bg = useSharedValue(CALENDAR_ACTIVE_BACKGROUND);
  // const interpolation = interpolateColors(bg.value, {
  //   inputRange: [0, 1],
  //   outputColorRange: [CALENDAR_ACTIVE_BACKGROUND, CALENDAR_BACKGROUND],
  // });

  const backgroundColor = useAnimatedStyle(() => {
    if (
      layout[index] &&
      activeTranslateY.value > layout[index].y - CARD_HEIGHT / 2 &&
      activeTranslateY.value <
        layout[index].y - CARD_HEIGHT / 2 + layout[index].height &&
      isActiveGlobal.value &&
      activeRowIndex.value !== index
    ) {
      return {
        backgroundColor: bg.value,
        width: SCREEN_WIDTH,
        height: 100,
        marginBottom: 20,
      };
    } else {
      return {
        backgroundColor: CALENDAR_BACKGROUND,
        width: SCREEN_WIDTH,
        height: 100,
        marginBottom: 20,
      };
    }
  });

  return (
    <PanGestureHandler>
      <Animated.View
        onLayout={({nativeEvent}) => {
          setLayout(prevState => ({...prevState, [index]: nativeEvent.layout}));
          layoutUI.value = {...layoutUI.value, [index]: nativeEvent.layout};
        }}
        {...{style: backgroundColor}}>
        <Text style={styles.dateText}>{day.date}</Text>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {},
  box: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropZone: {
    backgroundColor: 'gray',
  },
  cardText: {
    color: LIGHT_TEXT,
  },
  dateText: {
    paddingTop: 10,
    paddingLeft: 20,
    fontSize: 14,
    fontWeight: '600',
    color: DARK_TEXT,
  },
});
