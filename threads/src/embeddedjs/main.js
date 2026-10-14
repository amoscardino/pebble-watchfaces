import Poco from "commodetto/Poco";

let render = new Poco(screen);

const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);

const colorBackground = black;
const colorForeground = white;

const height = render.height;
const width = render.width;
const centerX = width / 2;
const centerY = height / 2;
const digitWidth = 75;
const digitHeight = 95;

const segmentWidth = Math.floor(digitWidth / 3);
const segmentHeight = Math.floor(digitHeight / 5);
const segmentInset = (segmentWidth - segmentHeight) / 2;
const segmentCenter = segmentInset + Math.floor(segmentHeight / 2);

const digitSpacingY = (segmentWidth - segmentHeight);

const lineThickness = 1;

// 3x5 segment representation for each digit
const digits = {
  '0': [
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  '1': [
    [0, 1, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  '2': [
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
  ],
  '3': [
    [1, 1, 1],
    [0, 0, 1],
    [0, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  '4': [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  '5': [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  '6': [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  '7': [
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  '8': [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  '9': [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ]
};

const drawLines = () => {
  render.origin(centerX, 0);

  // Lines run through the center of each segment column, continuing the grid
  // outward from the right and left digits
  for (let i = 0; i < 6; i++) {
    const x = (i * segmentWidth) + segmentCenter;
    render.drawLine(x, 0, x, height, colorForeground, lineThickness);
  }

  for (let i = 0; i < 6; i++) {
    const x = -digitWidth + ((2 - i) * segmentWidth) + segmentCenter;
    render.drawLine(x, 0, x, height, colorForeground, lineThickness);
  }

  render.origin();
};

const drawDigit = (digit, x, y) => {
  render.origin(x, y);

  const pattern = digits[digit];

  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[row].length; col++) {
      if (pattern[row][col]) {
        render.fillRectangle(colorForeground, (col * segmentWidth) + segmentInset, row * segmentHeight, segmentHeight, segmentHeight);
      }
    }
  }

  // Reset the origin to the default position
  render.origin();
};

const draw = (evt) => {
  const now = evt?.date ?? new Date();
  const hours = watch.hour12 ? (now.getHours() % 12 || 12) : now.getHours();
  const minutes = now.getMinutes();
  const hoursTensDigit = Math.floor(hours / 10);
  const hoursOnesDigit = hours % 10;
  const minutesTensDigit = Math.floor(minutes / 10);
  const minutesOnesDigit = minutes % 10;

  render.begin();

  render.fillRectangle(colorBackground, 0, 0, render.width, render.height);

  drawLines();

  if (hoursTensDigit > 0)
    drawDigit(hoursTensDigit, centerX - digitWidth, centerY - digitHeight - digitSpacingY);

  drawDigit(hoursOnesDigit, centerX, centerY - digitHeight - digitSpacingY);
  drawDigit(minutesTensDigit, centerX - digitWidth, centerY + digitSpacingY);
  drawDigit(minutesOnesDigit, centerX, centerY + digitSpacingY);

  render.end();
}

watch.addEventListener('minutechange', draw);
