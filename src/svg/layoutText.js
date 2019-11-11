import * as R from 'ramda';
import layoutEngine from '@react-pdf/textkit/layout';
import linebreaker from '@react-pdf/textkit/engines/linebreaker';
import justification from '@react-pdf/textkit/engines/justification';
import textDecoration from '@react-pdf/textkit/engines/textDecoration';
import scriptItemizer from '@react-pdf/textkit/engines/scriptItemizer';
import wordHyphenation from '@react-pdf/textkit/engines/wordHyphenation';
import AttributedString from '@react-pdf/textkit/attributedString';

import Font from '../font';
import transformText from '../text/transformText';
import isTextInstance from '../node/isTextInstance';
import fontSubstitution from '../text/fontSubstitution';

const engines = {
  linebreaker,
  justification,
  textDecoration,
  scriptItemizer,
  wordHyphenation,
  fontSubstitution,
};

const engine = layoutEngine(engines);

const layoutOptions = {
  hyphenationCallback: Font.getHyphenationCallback(),
  shrinkWhitespaceFactor: { before: -0.5, after: -0.5 },
};

const getFragments = instance => {
  if (!instance) return [{ string: '' }];

  let fragments = [];

  const {
    fill = 'black',
    fontFamily = 'Helvetica',
    fontWeight,
    fontStyle,
    fontSize = 18,
    textDecoration,
    textDecorationColor,
    textDecorationStyle,
    textTransform,
    opacity,
  } = instance.props;

  const obj = Font.getFont({ fontFamily, fontWeight, fontStyle });
  const font = obj ? obj.data : fontFamily;

  const attributes = {
    font,
    opacity,
    fontSize,
    color: fill,
    underlineStyle: textDecorationStyle,
    underline: textDecoration === 'underline',
    underlineColor: textDecorationColor || fill,
    strike: textDecoration === 'line-through',
    strikeStyle: textDecorationStyle,
    strikeColor: textDecorationColor || fill,
  };

  instance.children.forEach(child => {
    if (isTextInstance(child)) {
      fragments.push({
        string: transformText(child.value, textTransform),
        attributes,
      });
    } else {
      if (child) {
        fragments.push(...getFragments(child));
      }
    }
  });

  return fragments;
};

const getAttributedString = instance =>
  AttributedString.fromFragments(getFragments(instance));

const AlmostInfinity = 999999999999;

const layoutTspan = node => {
  const attributedString = getAttributedString(node);

  const x = R.pathOr(0, ['props', 'x'], node);
  const y = R.pathOr(0, ['props', 'y'], node);

  const container = { x, y, width: AlmostInfinity, height: AlmostInfinity };

  const lines = R.compose(
    R.reduce(R.concat, []),
    engine,
  )(attributedString, container, layoutOptions);

  return R.assoc('lines', lines, node);
};

const layoutText = R.evolve({
  children: R.map(layoutTspan),
});

export default layoutText;