/*
 * Formatter for Selenium 2 / WebDriver PHP client.
 */

var subScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
subScriptLoader.loadSubScript('chrome://selenium-ide/content/formats/webdriver.js', this);

function useSeparateEqualsForArray() {
  return true;
}

function testClassName(testName) {
  return testName.split(/[^0-9A-Za-z]+/).map(
      function(x) {
        return capitalize(x);
      }).join('');
}

function testMethodName(testName) {
  return "test" + testClassName(testName);
}

function nonBreakingSpace() {
  return "\"\\u00a0\"";
}

function array(value) {
	var str = 'array(';
	for ( var i = 0; i < value.length; i++) {
		str += string(value[i]);
		if (i < value.length - 1) str += ", ";
	}
	str += ')';
	return str;
};

Equals.prototype.toString = function() {
	return this.e1.toString() + " == " + this.e2.toString();
};

Equals.prototype.assert = function() {
    return "$this->assertEquals(" + this.e1.toString() + ", " + this.e2.toString() + ");";
};

Equals.prototype.verify = function() {
	return verify(this.assert());
};

NotEquals.prototype.toString = function() {
    return this.e1.toString() + " != " + this.e2.toString();
};

NotEquals.prototype.assert = function() {
    return "$this->assertNotEquals(" + this.e1.toString() + ", " + this.e2.toString() + ");";
};

NotEquals.prototype.verify = function() {
  return verify(this.assert());
};

function joinExpression(expression) {
    return "implode(',', " + expression.toString() + ")";
}

function statement(expression) {
  var s = expression.toString();
  if (s.length == 0) {
    return null;
  }
  return s + ';';
}

function assignToVariable(type, variable, expression) {
  return "$" + variable + " = " + expression.toString();
}

function ifCondition(expression, callback) {
  return "if (" + expression.toString() + ") {\n" + callback() + "}";
}

function assertTrue(expression) {
  return "$this->assertTrue(" + expression.toString() + ");";
}

function assertFalse(expression) {
  return "$this->assertFalse(" + expression.toString() + ");";
}

function verify(statement) {
  return "try {\n" +
      indents(1) + statement + "\n" +
      "} catch (PHPUnit_Framework_AssertionFailedError $e) {\n" +
      indents(1) + "array_push($this->verificationErrors, $e->toString());\n" +
      "}";
}

function verifyTrue(expression) {
  return verify(assertTrue(expression));
}

function verifyFalse(expression) {
  return verify(assertFalse(expression));
}

RegexpMatch.prototype.toString = function() {
    return "(bool)preg_match('/" + this.pattern.replace(/\//g, "\\/") + "/'," + this.expression + ")";
};

function waitFor(expression) {
    return "for ($second = 0; ; $second++) {\n" +
        "\tif ($second >= 60) $this->fail(\"timeout\");\n" +
        "\ttry {" + (expression.setup ? expression.setup() + " " : "") +
        "if (" + expression.toString() + ") break; } catch (Exception $e) {}\n" +
        "\tsleep(1);\n" +
        "}\n";
}

function assertOrVerifyFailure(line, isAssert) {
	var message = '"expected failure"';
	var failStatement = "fail(" + message + ");";
	return "try { " + line + " " + failStatement + "} catch (Exception $e) {}";
};

function pause(milliseconds) {
  return "usleep(" + parseInt(milliseconds, 10) + ");";
}

function echo(message) {
  return "print(" + xlateArgument(message) + ");";
}

function formatComment(comment) {
  return comment.comment.replace(/.+/mg, function(str) {
    return "// " + str;
  });
}

/**
 * Returns a string representing the suite for this formatter language.
 *
 * @param testSuite  the suite to format
 * @param filename   the file the formatted suite will be saved as
 */
function formatSuite(testSuite, filename) {
  var suiteClass = /^(\w+)/.exec(filename)[1];
  suiteClass = suiteClass[0].toUpperCase() + suiteClass.substring(1);

  var formattedSuite = "<phpunit>\n"
	  + indents(1) + "<testsuites>\n"
	  + indents(2) + "<testsuite name='" + suiteClass + "'>\n";

  for (var i = 0; i < testSuite.tests.length; ++i) {
    var testClass = testSuite.tests[i].getTitle();
    formattedSuite += indents(3)
        + "<file>" + testClass + "<file>\n";
  }

  formattedSuite += indents(2) + "</testsuite>\n"
      + indents(1) + "</testsuites>\n"
      + "</phpunit>\n";

  return formattedSuite;
}

function defaultExtension() {
  return this.options.defaultExtension;
}

this.options = {
  receiver: '$this',
  indent: 'tab',
  initialIndents: '2',
  showSelenese: 'false',
  defaultExtension: 'php',
  environment: 'firefox'
};

options.header =
    '<?php\n' +
    'class ${className} extends PHPUnit_Extensions_Selenium2TestCase {\n' +
    indents(1) + 'protected function setUp() {\n' +
    indents(2) + '${receiver}->setBrowser("${environment}");\n' +
    indents(2) + '${receiver}->setBrowserUrl("${baseURL}");\n' +
    indents(1) + '}\n' +
    '\n' +
    indents(1) + 'public function ${methodName}() {\n';

options.footer =
    indents(1) + '}\n' +
    '}\n' +
    "?>";

this.configForm =
    '<description>Variable for Selenium instance</description>' +
        '<textbox id="options_receiver" />' +
        '<description>Header</description>' +
        '<textbox id="options_header" multiline="true" flex="1" rows="4"/>' +
        '<description>Footer</description>' +
        '<textbox id="options_footer" multiline="true" flex="1" rows="4"/>' +
        '<description>Indent</description>' +
        '<menulist id="options_indent"><menupopup>' +
        '<menuitem label="Tab" value="tab"/>' +
        '<menuitem label="1 space" value="1"/>' +
        '<menuitem label="2 spaces" value="2"/>' +
        '<menuitem label="3 spaces" value="3"/>' +
        '<menuitem label="4 spaces" value="4"/>' +
        '<menuitem label="5 spaces" value="5"/>' +
        '<menuitem label="6 spaces" value="6"/>' +
        '<menuitem label="7 spaces" value="7"/>' +
        '<menuitem label="8 spaces" value="8"/>' +
        '</menupopup></menulist>' +
        '<checkbox id="options_showSelenese" label="Show Selenese"/>';

this.name = "PHPUnit (WebDriver)";
this.testcaseExtension = ".php";
this.suiteExtension = ".xml";
this.webdriver = true;

WDAPI.Driver = function() {
  this.ref = options.receiver;
};

WDAPI.Driver.searchContext = function(locatorType, locator) {
  var locatorString = xlateArgument(locator);
  switch (locatorType) {
    case 'xpath':
      return '$this->byXPath(' + locatorString + ')';
    case 'css':
      return '$this->byCssSelector(' + locatorString + ')';
    case 'id':
      return '$this->byId(' + locatorString + ')';
    case 'link':
      return '$this->byLinkText(' + locatorString + ')';
    case 'name':
      return '$this->byName(' + locatorString + ')';
    case 'tag_name':
      return '$this->byTagName(' + locatorString + ')';
  }
  throw 'Error: unknown strategy [' + locatorType + '] for locator [' + locator + ']';
};

WDAPI.Driver.prototype.back = function() {
  return this.ref + "->back()";
};

WDAPI.Driver.prototype.close = function() {
  return this.ref + "->closeWindow()";
};

WDAPI.Driver.prototype.findElement = function(locatorType, locator) {
  return new WDAPI.Element(WDAPI.Driver.searchContext(locatorType, locator));
};

WDAPI.Driver.prototype.findElements = function(locatorType, locator) {
  return new WDAPI.ElementList(this.ref + "->elements(" + this.ref + "->using('" + locatorType + "')->value('" + locator + "'))");
};

WDAPI.Driver.prototype.getCurrentUrl = function() {
  return this.ref + "->url()";
};

WDAPI.Driver.prototype.get = function(url) {
  return this.ref + "->url(" + url + ")";
};

WDAPI.Driver.prototype.getTitle = function() {
  return this.ref + "->title()";
};

WDAPI.Driver.prototype.getAlert = function() {
  return this.ref + "->alertText()";
};

WDAPI.Driver.prototype.chooseOkOnNextConfirmation = function() {
  return this.ref + "->acceptAlert()";
};

WDAPI.Driver.prototype.chooseCancelOnNextConfirmation = function() {
  return this.ref + "->dismissAlert()";
};

WDAPI.Driver.prototype.refresh = function() {
  return this.ref + "->refresh()";
};

WDAPI.Element = function(ref) {
  this.ref = ref;
};

WDAPI.Element.prototype.clear = function() {
  return this.ref + "->clear()";
};

WDAPI.Element.prototype.click = function() {
  return this.ref + "->click()";
};

WDAPI.Element.prototype.getAttribute = function(attributeName) {
  return this.ref + "->attribute(" + xlateArgument(attributeName) + ")";
};

WDAPI.Element.prototype.getText = function() {
  return this.ref + "->text()";
};

WDAPI.Element.prototype.isDisplayed = function() {
  return this.ref + "->displayed()";
};

WDAPI.Element.prototype.isSelected = function() {
  return this.ref + "->selected()";
};

WDAPI.Element.prototype.sendKeys = function(text) {
  return options.receiver + "->keys(" + xlateArgument(text) + ")";
};

WDAPI.Element.prototype.submit = function() {
  return this.ref + "->submit()";
};

WDAPI.Element.prototype.select = function(selectLocator) {
  if (selectLocator.type == 'index') {
    return options.receiver + "->select(" + this.ref + ")->criteria('xpath')->value('.//option[" + selectLocator.string + "]')";
  }
  if (selectLocator.type == 'value') {
    return options.receiver + "->select(" + this.ref + ")->selectOptionByValue(" + xlateArgument(selectLocator.string) + ")";
  }
  return options.receiver + "->select(" + this.ref + ")->selectOptionByLabel(" + xlateArgument(selectLocator.string) + ")";
};

WDAPI.ElementList = function(ref) {
  this.ref = ref;
};

WDAPI.ElementList.prototype.getItem = function(index) {
  return this.ref + "[" + index + "]";
};

WDAPI.ElementList.prototype.getSize = function() {
  return "count(" + this.ref + ")";
};

WDAPI.ElementList.prototype.isEmpty = function() {
  return "empty(" + this.ref + ")";
};

WDAPI.Utils = function() {
};

WDAPI.Utils.isElementPresent = function(how, what) {
  return "isElementPresent(" + WDAPI.Driver.searchContext(how, what) + ")";
};

