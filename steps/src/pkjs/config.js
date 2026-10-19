module.exports = [
  {
    "type": "heading",
    "defaultValue": "Steps"
  },
  {
    "type": "section",
    "items": [
      {
        "type": "slider",
        "messageKey": "GOAL",
        "label": "Daily Step Goal",
        "defaultValue": 10000,
        "min": 1000,
        "max": 30000,
        "step": 500
      }
    ]
  },
  {
    "type": "submit",
    "defaultValue": "Save"
  }
];
