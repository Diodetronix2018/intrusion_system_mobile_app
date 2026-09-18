import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Input, Screen, Typography } from '../../../components';
import { useTheme } from '../../../theme';
import { EventCard } from './EventCard';
import { EventFilterChips } from './EventFilterChips';
import { useEvents } from './useEvents';

export function EventsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { events, filter, setFilter, query, setQuery, loading, error } = useEvents();

  return (
    // `scrollable={false}`: the header (title/search/chips) stays put and
    // only the list below scrolls, using a plain ScrollView instead of
    // Screen's default KeyboardAwareScrollView. That library re-adjusts its
    // scroll offset around content-height changes for keyboard-avoidance
    // reasons, which fought with this screen's result count swinging from
    // 0 to 10 on every filter tap — the header would get shoved toward the
    // middle of the screen and the list would land far below it. A screen
    // like this (fixed header, independently scrolling list) never needed
    // keyboard-avoidance scrolling in the first place.
    <Screen
      edges={['left', 'right']}
      background={colors.background}
      scrollable={false}
    >
      <View style={[styles.flex, { gap: spacing.md }]}>
        <Typography
          variant="heading"
          size={22}
          align="left"
          color={colors.primary}
          style={{ marginBottom: spacing.xs }}
        >
          {t('events.title')}
        </Typography>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t('events.searchPlaceholder')}
          leftIcon={<Icon name="search-outline" size={20} color={colors.textSecondary} />}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={t('events.searchPlaceholder')}
        />

        <EventFilterChips value={filter} onChange={setFilter} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.listContent, { gap: spacing.md }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <Typography
              variant="body"
              align="center"
              color={colors.error}
              style={styles.status}
            >
              {error}
            </Typography>
          ) : loading && events.length === 0 ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.status}
            />
          ) : events.length === 0 ? (
            <Typography
              variant="body"
              align="center"
              color={colors.textSecondary}
              style={styles.status}
            >
              {t('events.empty')}
            </Typography>
          ) : (
            events.map(event => <EventCard key={event.id} event={event} />)
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  status: {
    marginTop: 32,
  },
});
