#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include "json.hpp"
using namespace std;
using json = nlohmann::json;

// average of the last few prices for every day, using a running sum
vector<double> smaSeries(const vector<double>& prices, int period) {
  vector<double> values(prices.size(), 0);
  double sum = 0;
  for (int i = 0; i < (int)prices.size(); i++) {
    sum += prices[i];
    if (i >= period) {
      sum -= prices[i - period];
    }
    if (i >= period - 1) {
      values[i] = sum / period;
    }
  }
  return values;
}

vector<double> emaSeries(const vector<double>& prices, int period) {
  vector<double> values(prices.size(), 0);
  if ((int)prices.size() < period) {
    return values;
  }
  double smoothing = 2.0 / (period + 1);
  double sum = 0;
  for (int i = 0; i < period; i++) {
    sum += prices[i];
  }
  double emaValue = sum / period;
  values[period - 1] = emaValue;
  for (int i = period; i < (int)prices.size(); i++) {
    emaValue = prices[i] * smoothing + emaValue * (1 - smoothing);
    values[i] = emaValue;
  }
  return values;
}

vector<double> rsiSeries(const vector<double>& prices, int period) {
  vector<double> values(prices.size(), 0);
  double gain = 0;
  double loss = 0;
  for (int i = 1; i < (int)prices.size(); i++) {
    double change = prices[i] - prices[i - 1];
    if (change > 0) {
      gain += change;
    } else {
      loss += -change;
    }
    if (i > period) {
      double oldChange = prices[i - period] - prices[i - period - 1];
      if (oldChange > 0) {
        gain -= oldChange;
      } else {
        loss -= -oldChange;
      }
    }
    if (i >= period) {
      double averageGain = gain / period;
      double averageLoss = loss / period;
      if (averageLoss == 0) {
        values[i] = 100.0;
      } else {
        double relativeStrength = averageGain / averageLoss;
        values[i] = 100.0 - 100.0 / (1 + relativeStrength);
      }
    }
  }
  return values;
}

// the sum of squares gives us the spread without a second loop
vector<double> bollingerSeries(const vector<double>& prices, int period, const string& band, double multiplier) {
  vector<double> values(prices.size(), 0);
  double sum = 0;
  double sumOfSquares = 0;
  for (int i = 0; i < (int)prices.size(); i++) {
    sum += prices[i];
    sumOfSquares += prices[i] * prices[i];
    if (i >= period) {
      sum -= prices[i - period];
      sumOfSquares -= prices[i - period] * prices[i - period];
    }
    if (i >= period - 1) {
      double mean = sum / period;
      if (band == "middle") {
        values[i] = mean;
      } else {
        double variance = sumOfSquares / period - mean * mean;
        if (variance < 0) {
          variance = 0;
        }
        double standardDeviation = sqrt(variance);
        if (band == "upper") {
          values[i] = mean + multiplier * standardDeviation;
        } else {
          values[i] = mean - multiplier * standardDeviation;
        }
      }
    }
  }
  return values;
}

// holds the strategy as a tree and checks it day by day
class Strategy {
 private:
  struct Node {
    string type;       // rule or an and/or group
    string indicator;  // price, sma, ema, rsi or bollinger
    string op;
    string band;       // only for bollinger
    double value;
    int period;
    double multiplier;
    vector<Node*> children;  // rules inside an and/or group
    vector<double> values;   // the indicator value for each day
    int startDay;            // first day it has enough history

    Node(string nodeType) {
      type = nodeType;
      value = 0;
      period = 0;
      multiplier = 0;
      startDay = 0;
    }
  };

  Node* root;

  // turn the json into a tree of nodes
  Node* buildHelperFunc(const json& data) {
    Node* node = new Node(data["type"]);
    if (node->type == "rule") {
      node->indicator = data["indicator"];
      node->op = data["operator"];
      if (node->indicator == "bollinger") {
        node->period = data["period"];
        node->band = data["band"];
        node->multiplier = data["multiplier"];
      } else {
        node->value = data["value"];
        if (node->indicator != "price") {
          node->period = data["period"];
        }
      }
    } else {
      // and/or group, build every rule inside it
      json rules = data["rules"];
      for (int i = 0; i < (int)rules.size(); i++) {
        node->children.push_back(buildHelperFunc(rules[i]));
      }
    }
    return node;
  }

  // work out each indicator once instead of redoing it every day
  void prepareHelperFunc(Node* node, const vector<double>& prices) {
    if (node == nullptr) {
      return;
    }
    if (node->type == "rule") {
      if (node->indicator != "price" &&
          (node->period <= 0 || node->period > (int)prices.size())) {
        node->startDay = (int)prices.size();
        return;
      }
      if (node->indicator == "sma") {
        node->values = smaSeries(prices, node->period);
        node->startDay = node->period - 1;
      } else if (node->indicator == "ema") {
        node->values = emaSeries(prices, node->period);
        node->startDay = node->period - 1;
      } else if (node->indicator == "rsi") {
        node->values = rsiSeries(prices, node->period);
        node->startDay = node->period;
      } else if (node->indicator == "bollinger") {
        node->values =
            bollingerSeries(prices, node->period, node->band, node->multiplier);
        node->startDay = node->period - 1;
      }
      return;
    }
    for (int i = 0; i < (int)node->children.size(); i++) {
      prepareHelperFunc(node->children[i], prices);
    }
  }

  bool checkRule(Node* node, const vector<double>& prices, int day) {
    if (node->indicator == "bollinger") {
      // not enough days, rule cant be true
      if (day < node->startDay) {
        return false;
      }
      double bandValue = node->values[day];
      double price = prices[day];
      if (node->op == ">") {
        return price > bandValue;
      }
      return price < bandValue;
    }

    double indicatorValue;
    if (node->indicator == "price") {
      indicatorValue = prices[day];
    } else {
      if (day < node->startDay) {
        return false;
      }
      indicatorValue = node->values[day];
    }

    if (node->op == ">") {
      return indicatorValue > node->value;
    }
    return indicatorValue < node->value;
  }

  // just making sure and/or rules are right
  // void printTree(Node* node, int depth) {
  //   for (int i = 0; i < depth; i++) {
  //     cerr << "  ";
  //   }
  //   if (node->type == "rule") {
  //     cerr << "rule " << node->indicator << " " << node->op << " " << node->value
  //          << " period=" << node->period << endl;
  //   } else {
  //     cerr << "group " << node->type << " with " << node->children.size() << " children" << endl;
  //     for (int i = 0; i < (int)node->children.size(); i++) {
  //       printTree(node->children[i], depth + 1);
  //     }
  //   }
  // }

  // walk the tree to see if the strategy is true today
  bool evaluateHelperFunc(Node* node, const vector<double>& prices, int day) {
    if (node == nullptr) {
      return false;
    }
    if (node->type == "rule") {
      return checkRule(node, prices, day);
    }
    if (node->type == "and") {
      for (int i = 0; i < (int)node->children.size(); i++) {
        if (!evaluateHelperFunc(node->children[i], prices, day)) {
          return false;
        }
      }
      return true;
    } else {
      for (int i = 0; i < (int)node->children.size(); i++) {
        if (evaluateHelperFunc(node->children[i], prices, day)) {
          return true;
        }
      }
      return false;
    }
  }

  void clearHelperFunc(Node* node) {
    if (node == nullptr) {
      return;
    }
    for (int i = 0; i < (int)node->children.size(); i++) {
      clearHelperFunc(node->children[i]);
    }
    delete node;
  }

 public:
  Strategy(const json& data) {
    root = buildHelperFunc(data);
    // printTree(root, 0);
  }
  ~Strategy() {
    clearHelperFunc(root);
  }
  void prepare(const vector<double>& prices) {
    prepareHelperFunc(root, prices);
  }
  bool evaluate(const vector<double>& prices, int day) {
    return evaluateHelperFunc(root, prices, day);
  }
};

int main() {
  string input;
  string line;
  while (getline(cin, line)) {
    input += line;
  }
  json data = json::parse(input);
  vector<double> prices = data["prices"];
  Strategy strategy(data["strategy"]);
  strategy.prepare(prices);

  double fee = 0.001; // 0.1%, same as binance
  double slippage = 0.0005; // 0.05%, you never get the exact price you see
  // hold the coin while the strategy is true, sit in cash when it isn't
  double cash = 10000.0;
  double coins = 0;
  int trades = 0;
  for (int day = 0; day < (int)prices.size() - 1; day++) {
    bool signal = strategy.evaluate(prices, day);
    // cant buy at today's close since we only know it once the day is over
    double price = prices[day + 1];
    if (signal && cash > 0) {
      // pay a bit over the price and the fee comes out of our cash
      double buyPrice = price * (1 + slippage);
      coins = (cash * (1 - fee)) / buyPrice;
      cash = 0;
      trades++;
    } else if (!signal && coins > 0) {
      // get a bit under the price and the fee comes off what we make
      double sellPrice = price * (1 - slippage);
      cash = coins * sellPrice * (1 - fee);
      coins = 0;
      trades++;
    }
  }

  double lastPrice = prices[prices.size() - 1];
  double finalValue = cash + coins * lastPrice;
  double returnPct = (finalValue - 10000.0) / 10000.0 * 100.0;
  double holdBuyPrice = prices[0] * (1 + slippage);
  double holdCoins = (10000.0 * (1 - fee)) / holdBuyPrice;
  double holdValue = holdCoins * lastPrice;
  double holdReturnPct = (holdValue - 10000.0) / 10000.0 * 100.0;

  json result;
  result["final_value"] = finalValue;
  result["return_pct"] = returnPct;
  result["trades"] = trades;
  result["hold_value"] = holdValue;
  result["hold_return_pct"] = holdReturnPct;
  cout << result.dump() << endl;
  return 0;
}
