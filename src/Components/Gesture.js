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
  interpolateColor,
  runOnUI,
  useAnimatedReaction,
  interpolate,
} from 'react-native-reanimated';
import {clamp} from 'react-native-redash';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '../config';
import moment from 'moment';
import {floor, get, isEqual, keys, parseInt, values} from 'lodash';
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

  const globalDroped = useSharedValue(false);

  const droppedRow = useSharedValue(null);
  const droppedSessionIndex = useSharedValue(null);

  const activeHoveringRowIndex = useSharedValue(-1);

  const indexCalendar = useSharedValue(0);

  const text = useSharedValue(null);

  const [stateText, setStateText] = useState('h');

  const [layout, setLayout] = useState([]);
  const layoutUI = useRef({});

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
          session:
            i % 3 !== 0
              ? Array(i < 3 ? i + 1 : i - 1)
                  .fill()
                  .map((_, index) => {
                    return {
                      name: sessionName[index],
                      id: `${i}-${index}-${sessionName[index]}`,
                      rowIndex: i,
                    };
                  })
              : [],
        };
      }),
    );
  }, []);

  const scrollTranslateX = useSharedValue(0);
  const scrollTranslateY = useSharedValue(0);
  const isScrollActive = useSharedValue(false);

  const sessionLength = useDerivedValue(() => {
    const index = activeHoveringRowIndex.value;
    return (
      calendar &&
      calendar[index] &&
      calendar[index].session &&
      calendar[index].session.length
    );
  }, [calendar]);

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

  const setTheCalendar = (newCalendar, sd) => {
    if (
      parseInt(sd) > -1
      // && parseInt(sd) !== activeRowIndex.value
    ) {
      droppedSessionIndex.value = newCalendar[sd].session.length;
      newCalendar[sd] &&
        newCalendar[sd].session.push(
          calendar[activeRowIndex.value].session[activeSessionIndex.value],
        );
      newCalendar[activeRowIndex.value].session.splice(
        activeSessionIndex.value,
        1,
      );
    }
    setCalendar(newCalendar);
  };

  const onDropSession = useCallback(
    (event, sd) => {
      'worklet';
      const newCalendar = [...calendar];
      runOnJS(setTheCalendar)(newCalendar, sd);
    },
    [calendar],
  );

  const onStartDrag = (row, session) => {
    setStateText(`row: ${row}, Session: ${session}`);
  };

  const onMove = index => {
    setStateText(`row: ${index}, Session: ${index}`);
  };

  //   const sessions = useMemo(() => {
  //    if(calendar && calendar.length) {
  //        calendar.map(day => )
  //    }
  //   }, [calendar]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>{stateText}</Text>
      {calendar.map((day, index) => (
        <CalendarRow
          key={day.id}
          day={day}
          setLayout={setLayout}
          layoutUI={layoutUI}
          index={index}
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
                layoutUI={layoutUI}
                sessionIndex={i}
                activeTranslateX={activeTranslateX}
                activeTranslateY={activeTranslateY}
                isActiveGlobal={isActiveGlobal}
                scrollTranslateX={scrollTranslateX}
                scrollTranslateY={scrollTranslateY}
                isScrollActive={isScrollActive}
                onDropSession={onDropSession}
                activeRowIndex={activeRowIndex}
                activeSessionIndex={activeSessionIndex}
                globalDroped={globalDroped}
                droppedRow={droppedRow}
                droppedSessionIndex={droppedSessionIndex}
                onStartDrag={onStartDrag}
                activeHoveringRowIndex={activeHoveringRowIndex}
                setStateText={setStateText}
                calendar={calendar}
                onMove={onMove}
                sessionLength={sessionLength}
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
  globalDroped,
  droppedRow,
  droppedSessionIndex,
  activeHoveringRowIndex,
  setStateText,
  onMove,
  sessionLength,
}) => {
  const isActive = useSharedValue(false);
  const translateX = useSharedValue(
    get(layoutUI.current, `${[rowIndex]}.x`, 0),
  );
  const translateY = useSharedValue(
    get(layoutUI.current, `${[rowIndex]}.y`, 0),
  );

  const opacityOndrop = useSharedValue(0);

  //const firstLAyour = useSharedValue(true);

  useAnimatedReaction(
    () => {
      return layoutUI.current && Object.values(layoutUI.current).length > 6;
    },
    data => {
      console.log('dataaa', data);
      // data holds what was returned from the first worklet's execution
      if (data) {
        // firstLAyour.value = false;
        // globalDroped.value = false;
        opacityOndrop.value = 1;
        if (
          droppedSessionIndex.value !== null &&
          droppedRow.value === rowIndex &&
          droppedSessionIndex.value === sessionIndex
        ) {
          translateX.value = activeTranslateX.value;
          translateY.value = activeTranslateY.value;
          droppedSessionIndex.value = null;
        }

        const layoutX =
          layoutUI.current &&
          layoutUI.current[rowIndex] &&
          layoutUI.current[rowIndex].x &&
          layoutUI.current[rowIndex].x;

        translateX.value = withSpring(
          layoutX + CARD_WIDTH_PADDING * sessionIndex + 10,
        );

        const layoutY =
          layoutUI.current &&
          layoutUI.current[rowIndex] &&
          layoutUI.current[rowIndex].y &&
          layoutUI.current[rowIndex].y;

        translateY.value = withSpring(layoutY + 38);
      }
    },
  );

  // const sessionLength = useSharedValue(-1);

  useAnimatedReaction(
    () => {
      const ac = sessionLength.value;
      return Math.floor(activeTranslateX.value / CARD_WIDTH_PADDING);
    },
    (current, prev) => {
      if (
        current !== prev &&
        activeHoveringRowIndex.value !== rowIndex &&
        isActiveGlobal.value
      ) {
        const layoutX =
          layoutUI.current &&
          layoutUI.current[rowIndex] &&
          layoutUI.current[rowIndex].x &&
          layoutUI.current[rowIndex].x;

        translateX.value = withSpring(
          layoutX + CARD_WIDTH_PADDING * sessionIndex + 10,
        );
      }
      //console.log('sessionLength.value', sessionLength.value);
      if (
        current !== prev &&
        activeHoveringRowIndex.value === rowIndex &&
        isActiveGlobal.value &&
        sessionLength.value
      ) {
        console.log('sessionLength.value', current);
        const layoutX =
          layoutUI.current &&
          layoutUI.current[rowIndex] &&
          layoutUI.current[rowIndex].x &&
          layoutUI.current[rowIndex].x;

        translateX.value = withSpring(
          layoutX + CARD_WIDTH_PADDING * sessionIndex + 10,
        );
        if (
          rowIndex === activeRowIndex.value

          // && sessionLength.value === activeSessionIndex.value + 1
        ) {
          const layoutDistance =
            layoutX + CARD_WIDTH_PADDING * sessionIndex + 10;

          if (
            sessionIndex >= current &&
            activeSessionIndex.value + 1 === sessionLength.value
          ) {
            translateX.value = withSpring(layoutDistance + CARD_WIDTH_PADDING);
          }

          if (
            sessionIndex >= current &&
            current < activeSessionIndex.value &&
            activeSessionIndex.value > sessionIndex
          ) {
            translateX.value = withSpring(layoutDistance + CARD_WIDTH_PADDING);
          }
          if (
            current > activeSessionIndex.value &&
            activeSessionIndex.value < sessionIndex &&
            current + activeSessionIndex.value >= sessionIndex
          ) {
            translateX.value = withSpring(layoutDistance - CARD_WIDTH_PADDING);
          }
        }
        if (
          rowIndex !== activeRowIndex.value &&
          sessionIndex >= current
          // && sessionIndex <= activeSessionIndex.value
          // && sessionLength.value === activeSessionIndex.value + 1
        ) {
          translateX.value = withSpring(
            layoutX +
              CARD_WIDTH_PADDING * sessionIndex +
              10 +
              CARD_WIDTH_PADDING,
          );
        }

        // if (
        //   sessionIndex >= current &&
        //   sessionLength.value !== activeSessionIndex.value + 1

        // ) {
        //   translateX.value = withSpring(
        //     layoutX +
        //       CARD_WIDTH_PADDING * sessionIndex +
        //       10 +
        //       CARD_WIDTH_PADDING,
        //   );
        // }

        if (sessionLength.value < current && sessionIndex <= current) {
          translateX.value = withSpring(
            current +
              CARD_WIDTH_PADDING * sessionIndex +
              10 +
              CARD_WIDTH_PADDING,
          );
        }
      }
    },
  );

  useDerivedValue(() => {
    const layoutX =
      layoutUI.current &&
      layoutUI.current[rowIndex] &&
      layoutUI.current[rowIndex].x &&
      layoutUI.current[rowIndex].x;

    if (
      sessionIndex > activeSessionIndex.value &&
      rowIndex === activeRowIndex.value &&
      isActiveGlobal.value &&
      !isActive.value
    ) {
      // translateX.value = withTiming(
      //   layoutX + CARD_WIDTH_PADDING * sessionIndex + 10 - CARD_WIDTH_PADDING,
      // );
    }

    // console.log(
    //   'activeRowIndex.value === rowIndex',
    //   activeHoveringRowIndex.value,
    // );
    // if (
    //   activeHoveringRowIndex.value === rowIndex &&
    //   sessionIndex !== activeSessionIndex.value
    // ) {
    //   const xIndex = Math.floor(activeTranslateX.value / CARD_WIDTH_PADDING);
    //   console.log('xIndex', xIndex);
    //   translateX.value = layoutX + CARD_WIDTH_PADDING * sessionIndex + 10;

    //   // if (sessionIndex >= xIndex && activeSessionIndex.value > xIndex) {
    //   //   translateX.value =
    //   //     layoutX + CARD_WIDTH_PADDING * sessionIndex + 10 + CARD_WIDTH_PADDING;
    //   // }

    //   // if (activeSessionIndex.value < xIndex && sessionIndex <= xIndex) {
    //   //   translateX.value =
    //   //     layoutX + CARD_WIDTH_PADDING * sessionIndex + 10 + CARD_WIDTH_PADDING;
    //   // }

    // if (
    //   scrollTranslateY.value > thisLayoutY &&
    //   scrollTranslateY.value < thisLayoutY + thisLayoutHeight &&
    //   isActive.value
    // ) {
    //   translateX.value =
    //     thisLayoutX +
    //     CARD_WIDTH_PADDING * sessionIndex +
    //     10 +
    //     scrollTranslateX.value;
    // }
  });

  const onGestureEvent = useAnimatedGestureHandler({
    onStart: (event, ctx) => {
      //opacityOndrop.value = 1;
      isActiveGlobal.value = true;
      isActive.value = true;
      ctx.offsetX = translateX.value;
      ctx.offsetY = translateY.value;
      activeTranslateX.value = translateX.value;
      activeTranslateY.value = translateY.value;
      //runOnJS(onStartDrag)(rowIndex, sessionIndex);
      activeRowIndex.value = rowIndex;
      activeSessionIndex.value = sessionIndex;
    },
    onActive: (event, ctx) => {
      translateX.value = clamp(ctx.offsetX + event.translationX, 0, boundX);
      translateY.value = clamp(ctx.offsetY + event.translationY, 0, boundY);
      //onDrop(event);
      activeTranslateX.value = translateX.value;
      activeTranslateY.value = translateY.value;
      activeHoveringRowIndex.value = Object.values(layoutUI.current).findIndex(
        item =>
          activeTranslateY.value > item.y - CARD_HEIGHT / 2 &&
          activeTranslateY.value < item.y - CARD_HEIGHT / 2 + item.height,
      );

      //runOnJS(onMove)(activeHoveringRowIndex.value);
    },
    onEnd: (event, ctx) => {
      isActiveGlobal.value = false;

      isActive.value = false;

      const sd = Object.values(layoutUI.current).findIndex(
        item =>
          activeTranslateY.value > item.y - CARD_HEIGHT / 2 &&
          activeTranslateY.value < item.y - CARD_HEIGHT / 2 + item.height,
      );

      // if (parseInt(sd) > -1) {
      //   //console.log('sdsdsdsd', parseInt(sd));
      //   translateX.value = activeTranslateX.value;
      //   translateY.value = activeTranslateY.value;
      // } else {
      //
      // }
      // translateX.value = activeTranslateX.value;
      // translateY.value = activeTranslateY.value;
      onDropSession(event, sd);
      droppedRow.value = sd;
      //opacityOndrop.value = 0;
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
  isActive,
  activeTranslateX,
  activeTranslateY,
  isActiveGlobal,
  onCalendarGesture,
  activeRowIndex,
}) => {
  const bg = useSharedValue(0);
  // const interpolation = interpolateColors(bg.value, {
  //   inputRange: [0, 1],
  //   outputColorRange: [CALENDAR_ACTIVE_BACKGROUND, CALENDAR_BACKGROUND],
  // });

  const isLayOver = useDerivedValue(() => {
    const thisLayout = layoutUI.current && layoutUI.current[index];
    const layoutY = thisLayout && thisLayout.y;
    const layoutHeight = thisLayout && thisLayout.height;

    const isIt =
      thisLayout &&
      activeTranslateY.value > layoutY - CARD_HEIGHT / 2 &&
      activeTranslateY.value < layoutY - CARD_HEIGHT / 2 + layoutHeight &&
      isActiveGlobal.value &&
      activeRowIndex.value !== index;

    return isIt ? withTiming(1, {duration: 0}) : withTiming(0, {duration: 400});
  });

  // const bgColors = interpolateColor(bg.value, {
  //   inputRange: [0, 1],
  //   outputColorRange: [CALENDAR_BACKGROUND, CALENDAR_ACTIVE_BACKGROUND],
  // });

  const backgroundColor = useAnimatedStyle(() => {
    const bgdd = interpolateColor(
      isLayOver.value,
      [0, 1],
      [CALENDAR_BACKGROUND, CALENDAR_ACTIVE_BACKGROUND],
    );
    return {
      backgroundColor: bgdd,
      width: SCREEN_WIDTH,
      height: 100,
      marginBottom: 20,
    };
  });

  return (
    <PanGestureHandler>
      <Animated.View
        onLayout={({nativeEvent}) => {
          setLayout({b: 1});
          layoutUI.current = {...layoutUI.current, [index]: nativeEvent.layout};
        }}
        style={backgroundColor}>
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
