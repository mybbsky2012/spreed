/**
 *
 * @copyright Copyright (c) 2018, Daniel Calviño Sánchez (danxuliu@gmail.com)
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

(function(OCA) {
	'use strict';

	var roomsChannel = Backbone.Radio.channel('rooms');

	OCA.Talk = OCA.Talk || {};
	OCA.Talk.PublicShare = {

		init: function() {
			var self = this;

			this.setupLayoutForTalkSidebar();

			this.setupSignalingEventHandlers();

			this.enableTalkSidebar();
		},

		setupLayoutForTalkSidebar: function() {
// 			$('body').append('<div id="content-wrapper"></div>');
// 			$('#content-wrapper').append($('#content'));
			$('#app-content').append($('footer'));

			this._$callContainerWrapper = $('<div id="call-container-wrapper" class="hidden"></div>');

			$('#content').append('<div id="talk-sidebar" class="disappear"></div>');
			$('#talk-sidebar').append(this._$callContainerWrapper);
			$('#call-container-wrapper').append('<div id="call-container"></div>');
			$('#call-container-wrapper').append('<div id="emptycontent"><div id="emptycontent-icon" class="icon-loading"></div><h2></h2><p class="emptycontent-additional"></p></div>');
			$('#call-container').append('<div id="videos"></div>');
			$('#call-container').append('<div id="screens"></div>');

			OCA.SpreedMe.app._emptyContentView = new OCA.SpreedMe.Views.EmptyContentView({
				el: '#call-container-wrapper > #emptycontent'
			});

			OCA.SpreedMe.app._localVideoView.render();
			$('#videos').append(OCA.SpreedMe.app._localVideoView.$el);
		},

		enableTalkSidebar: function() {
			var self = this;

			var shareToken = $('#sharingToken').val();

			if (this.hideTalkSidebarTimeout) {
				clearTimeout(this.hideTalkSidebarTimeout);
				delete this.hideTalkSidebarTimeout;
			}

			$.ajax({
				url: OC.linkToOCS('apps/spreed/api/v1', 2) + 'publicshare/' + shareToken,
				type: 'GET',
				beforeSend: function(request) {
					request.setRequestHeader('Accept', 'application/json');
				},
				success: function(ocsResponse) {
					self.setupRoom(ocsResponse.ocs.data.token);
				},
				error: function() {
					// Just keep sidebar hidden
				}
			});
		},

		setupSignalingEventHandlers: function() {
			var self = this;

			OCA.SpreedMe.app.signaling.on('joinRoom', function(joinedRoomToken) {
				if (OCA.SpreedMe.app.token !== joinedRoomToken) {
					return;
				}

				function setPageTitle(title) {
					if (title) {
						title += ' - ';
					} else {
						title = '';
					}
					title += t('spreed', 'Talk');
					title += ' - ' + oc_defaults.title;
					window.document.title = title;
				}

				OCA.SpreedMe.app.signaling.syncRooms().then(function() {
					OCA.SpreedMe.app._chatView.$el.appendTo('#talk-sidebar');
					OCA.SpreedMe.app._chatView.setTooltipContainer($('body'));

					// TODO not a good place to do all this, because it will be
					// added again in case of a reconnection.
					self._callButton = new OCA.SpreedMe.Views.CallButton({
						model: OCA.SpreedMe.app.activeRoom,
						connection: OCA.SpreedMe.app.connection,
					});
					// Force initial rendering; changes in the room state will
					// automatically render the button again from now on.
					self._callButton.render();
					self._callButton.$el.insertBefore(OCA.SpreedMe.app._chatView.$el);

					self.stopListening(OCA.SpreedMe.app.activeRoom, 'change:participantFlags', self._updateCallContainer);
					// Signaling uses its own event system, so Backbone methods can not
					// be used.
					OCA.SpreedMe.app.signaling.off('leaveCall', self._boundHideCallUi);

					if (OCA.SpreedMe.app.activeRoom) {
						self.listenTo(OCA.SpreedMe.app.activeRoom, 'change:participantFlags', self._updateCallContainer);
						// Signaling uses its own event system, so Backbone methods can
						// not be used.
						OCA.SpreedMe.app.signaling.on('leaveCall', self._boundHideCallUi);
					}

					OCA.SpreedMe.app._emptyContentView.setActiveRoom(OCA.SpreedMe.app.activeRoom);

					setPageTitle(OCA.SpreedMe.app.activeRoom.get('displayName'));

					OCA.SpreedMe.app._messageCollection.setRoomToken(OCA.SpreedMe.app.activeRoom.get('token'));
					OCA.SpreedMe.app._messageCollection.receiveMessages();

					self.showTalkSidebar();
				});
			});

			// TODO This should listen to "leaveRoom" on signaling instead, but
			// that would cause an ugly flicker due to the order in which the UI
			// elements would be modified (as the empty content message and the
			// "incall" CSS class are both modified when handling
			// "leaveCurrentRoom").
			roomsChannel.on('leaveCurrentRoom', function() {
				OCA.SpreedMe.app._chatView.$el.detach();

				self.leaveRoom();
			});
		},

		setupRoom: function(token) {
			OCA.SpreedMe.app.activeRoom = new OCA.SpreedMe.Models.Room({token: token});
			OCA.SpreedMe.app.signaling.setRoom(OCA.SpreedMe.app.activeRoom);

			OCA.SpreedMe.app.token = token;
			OCA.SpreedMe.app.signaling.joinRoom(token);
		},

// 		setupRoom: function(token) {
// 			var self = this;
// 
// 			OCA.SpreedMe.app.activeRoom = new OCA.SpreedMe.Models.Room({token: token});
// 			OCA.SpreedMe.app.signaling.setRoom(OCA.SpreedMe.app.activeRoom);
// 
// 			OCA.SpreedMe.app.signaling.on('leaveRoom', function(leftRoomToken) {
// 				if (token === leftRoomToken) {
// 					self.leaveRoom();
// 				}
// 			});
// 
// 			OCA.SpreedMe.app.connection.joinRoom(token);
// 
// 			OCA.SpreedMe.app._chatView.$el.prependTo('#talk-sidebar');
// 			OCA.SpreedMe.app._chatView.setTooltipContainer($('body'));
// 
// 			OCA.SpreedMe.app.signaling.on('joinRoom', function() {
// 				self.showTalkSidebar();
// 			});
// 		},

		_updateCallContainer: function() {
			var flags = OCA.SpreedMe.app.activeRoom.get('participantFlags') || 0;
			var inCall = flags & OCA.SpreedMe.app.FLAG_IN_CALL !== 0;
			if (inCall) {
				this._showCallUi();
			} else {
				this._hideCallUi();
			}
		},

		_showCallUi: function() {
			if (!this._$callContainerWrapper || !this._$callContainerWrapper.hasClass('hidden')) {
				return;
			}

			this._$callContainerWrapper.removeClass('hidden');

			// The icon to close the sidebar overlaps the video, so use its
			// white version with a shadow instead of the black one.
			// TODO Change it only when there is a call in progress; while
			// waiting for other participants it should be kept black. However,
			// this would need to hook in "updateParticipantsUI" which is where
			// the "incall" class is set.
			$('#app-sidebar .icon-close').addClass('force-icon-white-in-call icon-shadow');
		},

		_hideCallUi: function() {
			// Restore the icon to close the sidebar.
			$('#app-sidebar .icon-close').removeClass('force-icon-white-in-call icon-shadow');

			if (!this._$callContainerWrapper || this._$callContainerWrapper.hasClass('hidden')) {
				return;
			}

			this._$callContainerWrapper.addClass('hidden');
		},

		leaveRoom: function() {
			this.hideTalkSidebarTimeout = setTimeout(this.hideTalkSidebar, 5000);
		},

		showTalkSidebar: function() {
			$('#talk-sidebar').removeClass('disappear');
		},

		hideTalkSidebar: function() {
			$('#talk-sidebar').addClass('disappear');

			delete this.hideTalkSidebarTimeout;
		},
	};

	_.extend(OCA.Talk.PublicShare, Backbone.Events);

	OCA.SpreedMe.app = new OCA.Talk.Embedded();

	OCA.SpreedMe.app.on('start', function() {
		OCA.Talk.PublicShare.init();
	});

	// Unlike in the regular Talk app when Talk is embedded the signaling
	// settings are not initially included in the HTML, so they need to be
	// explicitly loaded before starting the app.
	OCA.Talk.Signaling.loadSettings().then(function() {
		OCA.SpreedMe.app.start();
	});
})(OCA);
