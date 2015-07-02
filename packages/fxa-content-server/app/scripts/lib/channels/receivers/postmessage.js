/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Receive a message over postMessage.
 */

define([
  'backbone',
  'underscore',
  'lib/auth-errors'
], function (Backbone, _, AuthErrors) {
  'use strict';


  function PostMessageReceiver() {
    // nothing to do
  }
  _.extend(PostMessageReceiver.prototype, Backbone.Events, {
    initialize: function (options) {
      options = options || {};

      this._origin = options.origin;
      this._window = options.window;

      this._boundReceiveEvent = this.receiveEvent.bind(this);
      this._window.addEventListener('message', this._boundReceiveEvent, false);
    },

    isOriginTrusted: function (origin) {
      // `message` events that come from the Fx Desktop browser have an
      // origin of the string constant 'null'. See
      // https://developer.mozilla.org/docs/Web/API/Window/postMessage#Using_win.postMessage_in_extensions
      // and
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1040257
      // These messages are trusted by default.
      //
      // Messages from the functional tests come from the page itself.
      if (origin === 'null') {
        return true;
      }

      return this._origin === origin;
    },

    receiveEvent: function (event) {
      if (event.type !== 'message') {
        return; // not an expected type of event
      }

      var origin = event.origin;
      if (! this.isOriginTrusted(origin)) {
        this._window.console.error(
          'postMessage received from %s, expected %s', origin, this._origin);

        // from an unexpected origin, drop it on the ground.
        var err = AuthErrors.toError('UNEXPECTED_POSTMESSAGE_ORIGIN');
        // set the unexpected origin as the context, this will be logged.
        err.context = origin;

        this.trigger('error', err);
        return;
      }

      if (! event.data) {
        return this.trigger('error', new Error('malformed event'));
      }

      this.trigger('message', event.data);
    },

    teardown: function () {
      this._window.removeEventListener('message', this._boundReceiveEvent, false);
    }
  });

  return PostMessageReceiver;
});

