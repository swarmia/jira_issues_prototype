/* @ds-bundle: {"format":4,"namespace":"SwarmiaDesignSystem_82ae1c","components":[{"name":"DEFAULT_TRANSITION_DURATION_SECONDS","sourcePath":"apps/frontend/src/styles/transition.ts"},{"name":"DEFAULT_TRANSITION_TIMING","sourcePath":"apps/frontend/src/styles/transition.ts"}],"sourceHashes":{"apps/frontend/src/palette.ts":"f87d2b1692b5","apps/frontend/src/styles/colors/colors-dark.ts":"f0c8b2879f18","apps/frontend/src/styles/colors/colors.ts":"458b20ccd177","apps/frontend/src/styles/theme.ts":"f84b84108310","apps/frontend/src/styles/transition.ts":"b44826f8db31"},"inlinedExternals":[],"unexposedExports":[{"name":"createFullDataPalette","sourcePath":"apps/frontend/src/palette.ts"},{"name":"createPalette","sourcePath":"apps/frontend/src/palette.ts"},{"name":"fontVariants","sourcePath":"apps/frontend/src/styles/theme.ts"},{"name":"theme","sourcePath":"apps/frontend/src/styles/theme.ts"},{"name":"themeColors","sourcePath":"apps/frontend/src/styles/colors/colors.ts"},{"name":"themeColorsDark","sourcePath":"apps/frontend/src/styles/colors/colors-dark.ts"},{"name":"transition","sourcePath":"apps/frontend/src/styles/transition.ts"}]} */

(() => {

const __ds_ns = (window.SwarmiaDesignSystem_82ae1c = window.SwarmiaDesignSystem_82ae1c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// apps/frontend/src/palette.ts
try { (() => {
function createPalette(colors) {
  const rawCssColors = colors.map(color => lightThemeColors[color]);
  return {
    /**
     * Fetch palette at index given as a parameter. Starts from the start of the list when all the colors are exhausted
     */
    fetchColor(index) {
      return colors[index % colors.length];
    },
    /**
     * Same as fetchColor(), but returns a raw CSS color.
     */
    fetchRawCssColor(index) {
      return rawCssColors[index % colors.length];
    },
    /**
     * Returns a random color name that hasn't been used yet. If all colors have already been used,
     * just returns a random color.
     *
     * For convenience, this accepts both color names and raw CSS colors as input.
     */
    fetchUnusedColor(usedColors) {
      const usedColorNames = usedColors.map(someColor => {
        if (isColorName(someColor)) return someColor;
        const maybeColorName = _.findKey(lightThemeColors,
        // Hardcoded to light theme because it's sent to the server.
        val => _.lowerCase(val) === _.lowerCase(someColor));
        if (isColorName(maybeColorName)) return maybeColorName;
        return null;
      }).filter(isNonNullable);
      const remainingColors = _.difference(colors, usedColorNames);
      return _.sample(remainingColors) ?? _.sample(colors) ?? colors[0];
    },
    allColors: rawCssColors
  };
}
function createFullDataPalette() {
  return createPalette(['dataLightblue', 'dataGreen', 'dataLightPurple', 'dataCoffee', 'dataPink', 'dataRed', 'dataPurple', 'dataBlue', 'dataTan', 'dataYellow', 'strokeLight']);
}
function isColorName(x) {
  return typeof x === 'string' && x in lightThemeColors;
}
Object.assign(__ds_scope, { createPalette, createFullDataPalette });
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/frontend/src/palette.ts", error: String((e && e.message) || e) }); }

// apps/frontend/src/styles/colors/colors-dark.ts
try { (() => {
/**
 * The main color palette for the design system's dark mode is defined here,
 * All alias colors are defined below this file and are used in the design system.
 * such as text, surface, stroke, button
 *
 * See the following links for more information:
 * @see https://swarmia.slack.com/archives/C06CH4DGEDS/p1718353039684959
 * @see https://swarmia.slack.com/archives/C06CH4DGEDS/p1718200362570289
 */
const colors = {
  transparent: 'transparent',
  white: 'white',
  red50: '#F9ECEF',
  red100: '#F2CFD5',
  red200: '#ECB0B9',
  red500: '#D54D55',
  red600: '#C93B4C',
  red900: '#6D152F',
  green50: '#E0F3E7',
  green100: '#CDEBD0',
  green400: '#5ABA89',
  green500: '#34AE73',
  green600: '#218D56',
  green700: '#11703F',
  blue50: '#F0F4FA',
  blue100: '#E1E6F5',
  blue200: '#C6D1EB',
  blue300: '#88A7EE',
  blue400: '#4C81FB',
  blue500: '#1A66D8',
  blue600: '#0A328F',
  blue700: '#002272',
  blue800: '#021E61',
  blue900: '#01122C',
  cyan50: '#e4f3f7',
  cyan600: '#137186',
  yellow50: '#FAF2EB',
  yellow300: '#FFC683',
  yellow500: '#FFB14E',
  yellow600: '#DA8038',
  yellow700: '#B55226',
  yellow800: '#6B0C0C',
  purple400: '#9F98E9',
  purple500: '#6252E2',
  purple600: '#4C40AF',
  black50: '#F2F3F4',
  black100: '#D9DCDE',
  black200: '#BFC3C8',
  black300: '#A4AAB3',
  black400: '#898F9E',
  black500: '#6E7489',
  black600: '#595F72',
  black700: '#454A5B',
  black800: '#313642',
  black900: '#1E212A',
  black: '#000',
  dataLightblue: '#64C2D7',
  dataGreen: '#55AF7D',
  dataPurple: '#645ACB',
  dataDarkPurple: '#544DA0',
  dataPink: '#E767C1',
  dataLightPurple: '#9295FF',
  messageLightPurple: '#9295FF26',
  dataBlue: '#174EA1',
  dataLightBlue: '#92d4e3',
  dataCoffee: '#AD7C6D',
  dataTan: '#CAA1A3',
  dataYellow: '#FFB14E',
  dataRed: '#D86060',
  dataGrey: '#C0C6D0',
  backgroundLightPink: '#E767C11A',
  backgroundLightPurple: '#9295FF1A',
  inherit: 'inherit',
  brightGreen: '#00BA6C',
  darkBlock: '#1B1A44',
  audioModeHighlight: '#53CCF1',
  menuBackgroundActive: '#4a4868',
  // Shades have opacity
  shadeBlack100: 'rgba(0, 0, 0, 0.1)',
  shadeBlack200: 'rgba(0, 0, 0, 0.2)'
};
const text = {
  textPrimary: colors.black50,
  textSecondary: colors.black300,
  textPlaceholder: colors.black500,
  textDisabled: colors.black600,
  textInvert: colors.black900,
  textCode: colors.blue200,
  textChartAxis: colors.black500,
  textLinkDefault: colors.blue300,
  textLinkSubtle: colors.black300,
  textLinkSubtleHover: colors.black50,
  textLinkDestructive: colors.red500,
  textDeltaPositive: colors.green400,
  textDeltaNegative: colors.red500,
  textDeltaNeutral: colors.black300,
  textComparisonGood: colors.cyan600
};
const surface = {
  surfaceDefault: colors.black900,
  surfaceHover: colors.black800,
  surfaceSelected: colors.black700,
  surfaceSelectedHover: colors.black600,
  surfaceInvert: colors.black50,
  surfaceTooltip: colors.black50,
  surfaceDeltaPositive: colors.green700,
  surfaceDeltaNegative: colors.red900,
  surfaceDeltaNeutral: colors.black700,
  surfaceWarning: colors.yellow800,
  surfaceSuccess: colors.green700,
  surfaceError: colors.red900
};
const stroke = {
  strokeDark: colors.black500,
  strokeLight: colors.black700
};
const button = {
  buttonPrimaryBg: colors.purple500,
  buttonPrimaryBgHover: colors.purple500,
  buttonPrimaryText: colors.white,
  buttonSecondaryBg: surface.surfaceSelected,
  buttonSecondaryBgHover: surface.surfaceSelectedHover,
  buttonSecondaryText: text.textPrimary,
  buttonGhostBg: colors.transparent,
  buttonGhostBgHover: surface.surfaceHover,
  buttonGhostText: text.textPrimary,
  buttonDestructiveBg: text.textDeltaNegative,
  buttonDestructiveBgHover: colors.red600,
  buttonDestructiveText: text.textPrimary,
  buttonFullWidthStroke: stroke.strokeLight,
  buttonFullWidthBg: colors.transparent,
  buttonFullWidthBgHover: surface.surfaceHover,
  buttonFullWidthText: text.textPrimary,
  buttonGhostBgDisabled: colors.white
};
const layout = {
  mainBackground: surface.surfaceDefault
};
const elevatedCard = {
  elevatedCardBorderWidth: '1px',
  elevatedCardBorderColor: stroke.strokeLight
};
const antd = {
  antdTooltipBackground: '#000000D1'
};
const workItem = {
  workItemCommit: '#fac76e',
  workItemPullRequestCreation: '#ef6b6b',
  workItemPullRequestMerge: '#61cdbb',
  workItemPullRequestMergeWithMergeAuthor: '#61cdbb',
  workItemPullRequestComment: '#dbd1c8',
  workItemPullRequestReview: '#9db286',
  workItemLegacyMaterializedPullRequestReview: '#9db286',
  workItemLegacyMaterializedPullRequestComment: '#dbd1c8',
  workItemIssueCreation: '#5662cf',
  workItemIssueCompletion: '#979ede'
};
const themeColorsDark = {
  ...colors,
  ...text,
  ...surface,
  ...stroke,
  ...button,
  ...layout,
  ...elevatedCard,
  ...antd,
  ...workItem
};
Object.assign(__ds_scope, { themeColorsDark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/frontend/src/styles/colors/colors-dark.ts", error: String((e && e.message) || e) }); }

// apps/frontend/src/styles/colors/colors.ts
try { (() => {
/**
 * The main color palette for the design system is defined here,
 * All alias colors are defined below this file and are used in the design system.
 * such as text, surface, stroke, button
 *
 * See the following links for more information:
 * @see https://swarmia.slack.com/archives/C06CH4DGEDS/p1718353039684959
 * @see https://swarmia.slack.com/archives/C06CH4DGEDS/p1718200362570289
 */
const colors = {
  transparent: 'transparent',
  white: 'white',
  red50: '#F9ECEF',
  red100: '#F2CFD5',
  red200: '#ECB0B9',
  red500: '#D54D55',
  red600: '#C53949',
  red900: '#6D152F',
  green50: '#E0F3E7',
  green100: '#CDEBD0',
  green400: '#5ABA89',
  green500: '#34AE73',
  green600: '#1F8755',
  green700: '#11703F',
  blue50: '#F0F4FA',
  blue100: '#E1E6F5',
  blue200: '#C6D1EB',
  blue300: '#88A7EE',
  blue400: '#4C81FB',
  blue500: '#1A66D8',
  blue600: '#0A328F',
  blue700: '#002272',
  blue800: '#021E61',
  blue900: '#01122C',
  cyan50: '#e4f3f7',
  cyan600: '#137186',
  yellow50: '#FAF2EB',
  yellow300: '#FFC683',
  yellow500: '#FFB14E',
  yellow600: '#DA8038',
  yellow700: '#B55226',
  yellow800: '#6B0C0C',
  purple400: '#9F98E9',
  purple500: '#6252E2',
  purple600: '#4C40AF',
  black50: '#F2F3F4',
  black100: '#D9DCDE',
  black200: '#BFC3C8',
  black300: '#A4AAB3',
  black400: '#898F9E',
  black500: '#6A6F83',
  black600: '#595F72',
  black700: '#454A5B',
  black800: '#313642',
  black900: '#1E212A',
  black: '#000',
  dataLightblue: '#64C2D7',
  dataGreen: '#55AF7D',
  dataPurple: '#645ACB',
  dataDarkPurple: '#544DA0',
  dataPink: '#E767C1',
  dataLightPurple: '#9295FF',
  messageLightPurple: '#9295FF26',
  dataBlue: '#174EA1',
  dataLightBlue: '#92d4e3',
  dataCoffee: '#AD7C6D',
  dataTan: '#CAA1A3',
  dataYellow: '#FFB14E',
  dataRed: '#D86060',
  dataGrey: '#C0C6D0',
  backgroundLightPink: '#E767C11A',
  backgroundLightPurple: '#9295FF1A',
  inherit: 'inherit',
  brightGreen: '#00BA6C',
  darkBlock: '#1B1A44',
  audioModeHighlight: '#53CCF1',
  menuBackgroundActive: '#4a4868',
  // Shades have opacity
  shadeBlack100: 'rgba(0, 0, 0, 0.1)',
  shadeBlack200: 'rgba(0, 0, 0, 0.2)'
};
const text = {
  textPrimary: colors.black900,
  textSecondary: colors.black600,
  textPlaceholder: colors.black500,
  textDisabled: colors.black400,
  textInvert: colors.transparent,
  textCode: colors.blue600,
  textChartAxis: colors.black500,
  textLinkDefault: colors.blue500,
  textLinkSubtle: colors.black600,
  textLinkSubtleHover: colors.black900,
  textLinkDestructive: colors.red600,
  textDeltaPositive: colors.green600,
  textDeltaNegative: colors.red600,
  textDeltaNeutral: colors.black600,
  textComparisonGood: colors.cyan600
};
const surface = {
  surfaceDefault: colors.transparent,
  surfaceHover: colors.blue50,
  surfaceSelected: colors.blue100,
  surfaceSelectedHover: colors.blue200,
  surfaceInvert: colors.black900,
  surfaceTooltip: colors.black900,
  surfaceDeltaPositive: colors.green50,
  surfaceDeltaNegative: colors.red50,
  surfaceDeltaNeutral: colors.black50,
  surfaceWarning: colors.yellow50,
  surfaceSuccess: colors.green50,
  surfaceError: colors.red50
};
const stroke = {
  strokeDark: colors.blue200,
  strokeLight: colors.blue100
};
const button = {
  buttonPrimaryBg: colors.purple500,
  buttonPrimaryBgHover: colors.purple600,
  buttonPrimaryText: colors.white,
  buttonSecondaryBg: surface.surfaceSelected,
  buttonSecondaryBgHover: surface.surfaceSelectedHover,
  buttonSecondaryText: colors.blue900,
  buttonGhostBg: surface.surfaceDefault,
  buttonGhostBgHover: surface.surfaceHover,
  buttonGhostText: colors.blue900,
  buttonDestructiveBg: surface.surfaceDeltaNegative,
  buttonDestructiveBgHover: colors.red100,
  buttonDestructiveText: text.textLinkDestructive,
  buttonFullWidthStroke: stroke.strokeLight,
  buttonFullWidthBg: surface.surfaceDefault,
  buttonFullWidthBgHover: surface.surfaceHover,
  buttonFullWidthText: text.textLinkSubtle,
  buttonGhostBgDisabled: colors.white
};
const layout = {
  mainBackground: colors.white
};
const elevatedCard = {
  elevatedCardBorderWidth: '0',
  elevatedCardBorderColor: 'transparent'
};
const antd = {
  antdTooltipBackground: '#000000D1'
};
const workItem = {
  workItemCommit: '#fac76e',
  workItemPullRequestCreation: '#ef6b6b',
  workItemPullRequestMerge: '#61cdbb',
  workItemPullRequestMergeWithMergeAuthor: '#61cdbb',
  workItemPullRequestComment: '#dbd1c8',
  workItemPullRequestReview: '#9db286',
  workItemLegacyMaterializedPullRequestReview: '#9db286',
  workItemLegacyMaterializedPullRequestComment: '#dbd1c8',
  workItemIssueCreation: '#5662cf',
  workItemIssueCompletion: '#979ede'
};
const themeColors = {
  ...colors,
  ...text,
  ...surface,
  ...stroke,
  ...button,
  ...layout,
  ...elevatedCard,
  ...antd,
  ...workItem
};
Object.assign(__ds_scope, { themeColors });
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/frontend/src/styles/colors/colors.ts", error: String((e && e.message) || e) }); }

// apps/frontend/src/styles/theme.ts
try { (() => {
/**
 * Most of the documentation for how the theme and the design system works is on Storybook.
 *
 * But here's a few sources of information on the theme specification for the technically inclined:
 *
 * @see https://styled-system.com/theme-specification/
 * @see https://github.com/primer/components/blob/main/src/theme-preval.js
 * @see https://styled-system.com/guides/why-powers-of-two/
 * @see https://github.com/styled-system/styled-system/blob/master/packages/space/src/index.js#L4
 * @see https://www.figma.com/file/2YJF2uNmWmngamPIE9rsXI/Swarmia-Design-System?node-id=945%3A505
 * @see https://www.figma.com/file/lYkeZmzZO720ydXNVeyq8V/Swarmia-Colors?node-id=0%3A1
 * @see node_modules/@types/styled-system/index.d.ts#Theme
 */
const theme = {
  space: [],
  // we don't use the styled-system space scale, but we must keep this property around, so that styled-system doesn't fill in its default scale, which would override our SpaceScaleValue

  fontSizes: [13, 14, 16, 18, 20, 24, 32, 40, 56, 64, 100],
  fontWeights: [400, 500, 600, 700],
  lineHeights: ['16px', '20px', '24px', '32px', '40px'],
  fonts: {
    inherit: 'inherit',
    Monospace: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;",
    FactorA: "FactorA, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    Inter: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
  },
  letterSpacings: ['0.03em', '0.003em', 'normal', '-0.015em', '-0.01em', '-0.02em', '0.06em'],
  sizes: {
    '100%': '100%',
    '100svh': '100svh',
    '100svw': '100svw',
    layoutMaxWidth: 1440,
    textMaxWidth: 600,
    configurationMaxWidth: 640,
    layoutMinWidth: 1040,
    homeMaxWidth: 1060,
    navbarWidth: 64,
    // TODO make sidebarWidth: 200 when Software capitalization menu item's label `Beta` is removed
    sidebarWidth: 220,
    iconLarge: 32,
    iconMedium: 24,
    iconSmall: 16,
    chartHeightCompact: 408,
    chartHeightSmall: 196,
    chartHeightSparkline: 60,
    filterConditionMaxWidth: 204
  },
  borderWidths: {
    thin: 1,
    semi: 1.5,
    medium: 2
  },
  radii: {
    tiny: 2,
    small: 3,
    medium: 6,
    large: 12,
    chatBubble: 24,
    round: 9999 // this is the value Tailwind uses so it must be good ¯\_(ツ)_/¯
  },
  shadows: {
    small: '0px 2px 4px 0px rgba(0, 0, 0, 0.03), 0px 2px 4px 0px rgba(0, 0, 0, 0.05)',
    medium: '0px 13px 12px rgba(0, 0, 0, 0.1), 0px 17px 38px rgba(23, 23, 26, 0.1)',
    large: '0px 17px 38px 0px rgba(23, 23, 26, 0.1), 0px 13px 12px 0px rgba(0, 0, 0, 0.1)',
    active: '0 0 0 2px rgb(26, 102, 216, 0.2)',
    error: '0 0 0 2px rgb(220, 53, 69, 0.2)',
    paper1: '0px 2px 2px 0px rgba(0, 0, 0, 0.02), 0px 1px 1px 0px rgba(0, 0, 0, 0.06)',
    inputLarge: '0px 1px 1px 0px rgba(0, 0, 0, 0.06) inset, 0px 3px 2px 0px rgba(0, 0, 0, 0.01) inset'
  }
};
const mainText = {
  fontFamily: theme.fonts.Inter,
  fontSize: 16,
  lineHeight: '24px',
  fontWeight: 400
};
const fontVariants = {
  h1: {
    fontFamily: theme.fonts.FactorA,
    fontSize: 32,
    lineHeight: '40px',
    letterSpacing: '-0.01em',
    fontWeight: 700
  },
  h2: {
    fontFamily: theme.fonts.FactorA,
    fontSize: 24,
    lineHeight: '32px',
    letterSpacing: 'normal',
    fontWeight: 700
  },
  h3: {
    fontFamily: theme.fonts.FactorA,
    fontSize: 20,
    lineHeight: '24px',
    letterSpacing: 'normal',
    fontWeight: 700
  },
  h4: {
    fontFamily: theme.fonts.FactorA,
    fontSize: 18,
    lineHeight: '24px',
    letterSpacing: 'normal',
    fontWeight: 700
  },
  h5: {
    fontFamily: theme.fonts.FactorA,
    fontSize: 16,
    lineHeight: '24px',
    letterSpacing: '0.003em',
    fontWeight: 700
  },
  h6: {
    fontFamily: theme.fonts.FactorA,
    fontSize: 13,
    lineHeight: '16px',
    letterSpacing: '0.06em',
    fontWeight: 500,
    textTransform: 'uppercase'
  },
  mainText,
  description: {
    ...mainText,
    color: 'var(--textSecondary)'
  },
  largeLabel: {
    fontFamily: theme.fonts.Inter,
    fontSize: 16,
    lineHeight: '20px',
    letterSpacing: '-0.015em',
    fontWeight: 500
  },
  normalLabel: {
    fontFamily: theme.fonts.Inter,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500
  },
  normalLabelBold: {
    fontFamily: theme.fonts.Inter,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 700
  },
  smallLabel: {
    fontFamily: theme.fonts.Inter,
    fontSize: 13,
    lineHeight: '16px',
    fontWeight: 500
  },
  small: {
    fontFamily: theme.fonts.Inter,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 400
  },
  chartAxisLabel: {
    fontFamily: theme.fonts.Inter,
    fontSize: 12,
    lineHeight: '16px',
    fontWeight: 400
  },
  button: {
    fontFamily: theme.fonts.FactorA,
    fontSize: 16,
    lineHeight: '20px',
    letterSpacing: 'normal',
    fontWeight: 500
  },
  code: {
    fontFamily: theme.fonts.Monospace,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '20px',
    borderRadius: theme.radii.small,
    color: 'var(--textCode)',
    borderColor: 'var(--strokeDark)',
    backgroundColor: 'var(--surfaceHover)',
    paddingX: 8,
    display: 'inline-block',
    borderWidth: 'thin',
    borderStyle: 'solid'
  },
  medium: {
    fontFamily: theme.fonts.FactorA,
    fontSize: 18,
    lineHeight: '24px',
    fontWeight: 400
  },
  toolbarUnderline: {
    fontFamily: theme.fonts.Inter,
    fontSize: 16,
    lineHeight: '24px',
    fontWeight: 500,
    textDecoration: 'underline',
    textUnderlineOffset: '2px'
  },
  xxLargeHeading: {
    fontFamily: theme.fonts.FactorA,
    fontSize: 56,
    lineHeight: '64px',
    fontWeight: 700,
    letterSpacing: '-0.02em'
  }
};
Object.assign(__ds_scope, { fontVariants, theme, __ds_default_apps_frontend_src_styles_theme_1xpig44: theme });
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/frontend/src/styles/theme.ts", error: String((e && e.message) || e) }); }

// apps/frontend/src/styles/transition.ts
try { (() => {
const DEFAULT_TRANSITION_DURATION_SECONDS = 0.2;
const DEFAULT_TRANSITION_TIMING = `${DEFAULT_TRANSITION_DURATION_SECONDS}s ease`;
const transition = (property = 'all') => {
  return `${_.kebabCase(property)} ${DEFAULT_TRANSITION_TIMING}`;
};
Object.assign(__ds_scope, { DEFAULT_TRANSITION_DURATION_SECONDS, DEFAULT_TRANSITION_TIMING, transition });
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/frontend/src/styles/transition.ts", error: String((e && e.message) || e) }); }

__ds_ns.DEFAULT_TRANSITION_DURATION_SECONDS = __ds_scope.DEFAULT_TRANSITION_DURATION_SECONDS;

__ds_ns.DEFAULT_TRANSITION_TIMING = __ds_scope.DEFAULT_TRANSITION_TIMING;

})();
