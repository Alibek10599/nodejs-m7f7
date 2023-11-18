const timeTypes = {
    second: 1000,
    minute: 60,
    hour: 60,
    day: 24,
    week: 7,
};

const timeUnits = Object.keys(timeTypes)

module.exports = function timeToMs(time, unit) {
    if (unit === 'second') {
        return time * timeTypes[unit];
    }

    return timeToMs(
        time * timeTypes[unit],
        timeUnits[timeUnits.indexOf(unit) - 1],
    );
}