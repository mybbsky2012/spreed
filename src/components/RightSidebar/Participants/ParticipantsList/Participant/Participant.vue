<!--
  - @copyright Copyright (c) 2019 Joas Schilling <coding@schilljs.com>
  -
  - @author Joas Schilling <coding@schilljs.com>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
-->

<template>
	<li
		class="participant-row"
		:class="{
			'offline': isOffline,
			'currentUser': isSelf,
			'guestUser': isGuest,
			'isSearched': isSearched,
			'selected': isSelected }"
		:aria-label="participantAriaLabel"
		:role="isSearched ? 'listitem' : ''"
		:tabindex="isSearched ? 0 : -1"
		v-on="isSearched ? { click: handleClick, 'keydown.enter': handleClick } : {}"
		@keydown.enter="handleClick">
		<!-- Participant's avatar -->
		<AvatarWrapper
			:id="computedId"
			:disable-tooltip="true"
			:disable-menu="isSearched"
			:size="44"
			:show-user-status="showUserStatus && !isSearched"
			:show-user-status-compact="false"
			:preloaded-user-status="preloadedUserStatus"
			:name="computedName"
			:source="participant.source || participant.actorType"
			:offline="isOffline"
			:menu-container="container" />

		<!-- Participant's data -->
		<div
			class="participant-row__user-wrapper"
			:class="{
				'has-call-icon': callIcon,
				'has-menu-icon': canBeModerated && !isSearched
			}">
			<!-- First line: participant's name and type -->
			<div
				ref="userName"
				class="participant-row__user-descriptor"
				@mouseover="updateUserNameNeedsTooltip()">
				<span
					v-tooltip.auto="userTooltipText"
					class="participant-row__user-name">{{ computedName }}</span>
				<span v-if="showModeratorLabel" class="participant-row__moderator-indicator">({{ t('spreed', 'moderator') }})</span>
				<span v-if="isBridgeBotUser" class="participant-row__moderator-indicator">({{ t('spreed', 'bot') }})</span>
				<span v-if="isGuest" class="participant-row__guest-indicator">({{ t('spreed', 'guest') }})</span>
			</div>

			<!-- Second line: participant status message if applicable -->
			<div
				v-if="statusMessage"
				ref="statusMessage"
				class="participant-row__status"
				@mouseover="updateStatusNeedsTooltip()">
				<span v-tooltip.auto="statusMessageTooltip">{{ statusMessage }}</span>
			</div>
		</div>

		<!-- Call state icon -->
		<div
			v-if="callIcon"
			v-tooltip.auto="callIconTooltip"
			class="participant-row__callstate-icon">
			<span class="hidden-visually">{{ callIconTooltip }}</span>
			<Microphone
				v-if="callIcon === 'audio'"
				:size="20"
				title=""
				decorative />
			<Phone
				v-if="callIcon === 'phone'"
				:size="20"
				title=""
				decorative />
			<Video
				v-if="callIcon === 'video'"
				:size="20"
				title=""
				decorative />
			<!-- The following icon is much bigger than all the others
						so we reduce its size -->
			<HandBackLeft
				v-if="callIcon === 'hand'"
				decorative
				title=""
				:size="18" />
		</div>

		<!-- Participant's actions menu -->
		<Actions
			v-if="canBeModerated && !isSearched"
			:container="container"
			:aria-label="participantSettingsAriaLabel"
			:force-menu="true"
			class="participant-row__actions">
			<template #icon>
				<LockOpenVariant
					v-if="actionIcon === 'LockOpenVariant'"
					:size="20"
					decorative />
				<Lock
					v-else-if="actionIcon === 'Lock'"
					:size="20"
					decorative />
				<Tune
					v-else-if="actionIcon === 'Tune'"
					:size="20"
					decorative />
				<DotsHorizontal
					v-else
					:size="20"
					decorative />
			</template>
			<ActionText
				v-if="attendeePin"
				:title="t('spreed', 'Dial-in PIN')"
				icon="icon-password">
				{{ attendeePin }}
			</ActionText>
			<ActionButton
				v-if="canBeDemoted"
				:close-after-click="true"
				@click="demoteFromModerator">
				<template #icon>
					<Account
						:size="20"
						title=""
						decorative />
					{{ t('spreed', 'Demote from moderator') }}
				</template>
			</ActionButton>
			<ActionButton
				v-if="canBePromoted"
				:close-after-click="true"
				@click="promoteToModerator">
				<template #icon>
					<Crown
						:size="20"
						title=""
						decorative />
				</template>
				{{ t('spreed', 'Promote to moderator') }}
			</ActionButton>

			<!-- Permissions -->
			<template v-if="selfIsModerator && !isModerator">
				<ActionSeparator />
				<ActionButton
					v-if="hasNonDefaultPermissions"
					:close-after-click="true"
					@click="applyDefaultPermissions">
					<template #icon>
						<LockReset
							:size="20"
							title=""
							decorative />
					</template>
					{{ t('spreed', 'Reset custom permissions') }}
				</ActionButton>
				<ActionButton
					:close-after-click="true"
					@click="grantAllPermissions">
					<template #icon>
						<LockOpenVariant
							:size="20"
							title=""
							decorative />
					</template>
					{{ t('spreed', 'Grant all permissions') }}
				</ActionButton>
				<ActionButton
					:close-after-click="true"
					@click="removeAllPermissions">
					<template #icon>
						<Lock
							:size="20"
							title=""
							decorative />
					</template>
					{{ t('spreed', 'Remove all permissions') }}
				</ActionButton>
				<ActionButton
					:close-after-click="true"
					@click="showPermissionsEditor">
					<template #icon>
						<Pencil
							:size="20"
							title=""
							decorative />
					</template>
					{{ t('spreed', 'Edit permissions') }}
				</ActionButton>
			</template>
			<ActionButton
				v-if="isEmailActor"
				icon="icon-mail"
				:close-after-click="true"
				@click="resendInvitation">
				{{ t('spreed', 'Resend invitation') }}
			</ActionButton>
			<ActionSeparator v-if="attendeePin || canBePromoted || canBeDemoted || isEmailActor" />
			<ActionButton
				icon="icon-delete"
				:close-after-click="true"
				@click="removeParticipant">
				<template v-if="isGroup">
					{{ t('spreed', 'Remove group and members') }}
				</template>
				<template v-else>
					{{ t('spreed', 'Remove participant') }}
				</template>
			</ActionButton>
		</Actions>
		<ParticipantPermissionsEditor
			v-if="permissionsEditor"
			:actor-id="participant.actorId"
			:close-after-click="true"
			:participant="participant"
			:token="token"
			@close="hidePermissionsEditor" />
		<!-- Checkmark in case the current participant is selected -->
		<div v-if="isSelected" class="icon-checkmark participant-row__utils utils__checkmark" />
	</li>
</template>

<script>

import { showError, showSuccess } from '@nextcloud/dialogs'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ActionText from '@nextcloud/vue/dist/Components/ActionText'
import ActionSeparator from '@nextcloud/vue/dist/Components/ActionSeparator'
import Tooltip from '@nextcloud/vue/dist/Directives/Tooltip'
import Actions from '@nextcloud/vue/dist/Components/Actions'
import { CONVERSATION, PARTICIPANT, ATTENDEE } from '../../../../../constants'
import UserStatus from '../../../../../mixins/userStatus'
import readableNumber from '../../../../../mixins/readableNumber'
import isEqual from 'lodash/isEqual'
import AvatarWrapper from '../../../../AvatarWrapper/AvatarWrapper'
import ParticipantPermissionsEditor from './ParticipantPermissionsEditor/ParticipantPermissionsEditor.vue'

// Material design icons
import DotsHorizontal from 'vue-material-design-icons/DotsHorizontal'
import Microphone from 'vue-material-design-icons/Microphone'
import Phone from 'vue-material-design-icons/Phone'
import Video from 'vue-material-design-icons/Video'
import Crown from 'vue-material-design-icons/Crown.vue'
import Account from 'vue-material-design-icons/Account.vue'
import Lock from 'vue-material-design-icons/Lock.vue'
import LockOpenVariant from 'vue-material-design-icons/LockOpenVariant.vue'
import Tune from 'vue-material-design-icons/Tune.vue'
import Pencil from 'vue-material-design-icons/Pencil.vue'
import HandBackLeft from 'vue-material-design-icons/HandBackLeft'
import LockReset from 'vue-material-design-icons/LockReset.vue'

export default {
	name: 'Participant',

	components: {
		Actions,
		ActionButton,
		ActionText,
		ActionSeparator,
		AvatarWrapper,
		ParticipantPermissionsEditor,

		// Material design icons
		DotsHorizontal,
		Microphone,
		Phone,
		Video,
		HandBackLeft,
		Crown,
		Account,
		Lock,
		LockOpenVariant,
		Pencil,
		Tune,
		LockReset,
	},

	directives: {
		tooltip: Tooltip,
	},

	mixins: [
		UserStatus,
		readableNumber,
	],

	props: {
		participant: {
			type: Object,
			required: true,
		},

		/**
		 * Whether to show the user status on the avatar.
		 * This does not affect the status message row.
		 */
		showUserStatus: {
			type: Boolean,
			default: true,
		},

		/**
		 * Toggles the bulk selection state of this component
		 */
		isSelectable: {
			type: Boolean,
			default: false,
		},
	},

	data() {
		return {
			isUserNameTooltipVisible: false,
			isStatusTooltipVisible: false,
			permissionsEditor: false,
		}
	},

	computed: {
		container() {
			return this.$store.getters.getMainContainerSelector()
		},

		participantSettingsAriaLabel() {
			return t('spreed', 'Settings for participant "{user}"', { user: this.computedName })
		},

		participantAriaLabel() {
			if (this.isSearched) {
				return t('spreed', 'Add participant "{user}"', { user: this.computedName })
			} else {
				return t('spreed', 'Participant "{user}"', { user: this.computedName })
			}
		},

		userTooltipText() {
			if (!this.isUserNameTooltipVisible) {
				return false
			}
			let text = this.computedName
			if (this.showModeratorLabel) {
				text += ' (' + t('spreed', 'moderator') + ')'
			}
			if (this.isBridgeBotUser) {
				text += ' (' + t('spreed', 'bot') + ')'
			}
			if (this.isGuest) {
				text += ' (' + t('spreed', 'guest') + ')'
			}
			return text
		},

		statusMessage() {
			return this.getStatusMessage(this.participant)
		},

		statusMessageTooltip() {
			if (!this.isStatusTooltipVisible) {
				return false
			}

			return this.statusMessage
		},

		/**
		 * Check if the current participant belongs to the selected participants array
		 * in the store
		 *
		 * @return {boolean}
		 */
		isSelected() {
			if (this.isSelectable) {
				let isSelected = false
				this.$store.getters.selectedParticipants.forEach(selectedParticipant => {
					if (isEqual(selectedParticipant, this.participant)) {
						isSelected = true
					}
				})
				return isSelected
			}
			return false
		},

		/**
		 * If the Participant component is used as to display a search result, it will
		 * return true. We use this not to display actions on the searched contacts and
		 * groups.
		 *
		 * @return {boolean}
		 */
		isSearched() {
			return this.participant.label !== undefined
		},

		isEmailActor() {
			return this.participant.actorType === ATTENDEE.ACTOR_TYPE.EMAILS
		},

		computedName() {
			if (!this.isSearched) {
				const displayName = this.participant.displayName.trim()

				if (displayName === '' && this.isGuest) {
					return t('spreed', 'Guest')
				}

				if (displayName === '') {
					return t('spreed', 'Deleted user')
				}

				return displayName
			}
			return this.participant.label
		},

		computedId() {
			if (!this.isSearched) {
				return this.participant.actorId
			}
			return this.attendeeId
		},

		attendeeId() {
			return this.participant.attendeeId
		},

		label() {
			return this.participant.label
		},

		isHandRaised() {
			if (this.isSearched || this.participant.inCall === PARTICIPANT.CALL_FLAG.DISCONNECTED) {
				return false
			}

			const raisedState = this.$store.getters.getParticipantRaisedHand(this.participant.sessionIds)
			return raisedState.state
		},

		callIcon() {
			if (this.isSearched || this.participant.inCall === PARTICIPANT.CALL_FLAG.DISCONNECTED) {
				return ''
			}
			if (this.isHandRaised) {
				return 'hand'
			}
			const withVideo = this.participant.inCall & PARTICIPANT.CALL_FLAG.WITH_VIDEO
			if (withVideo) {
				return 'video'
			}
			const withPhone = this.participant.inCall & PARTICIPANT.CALL_FLAG.WITH_PHONE
			if (withPhone) {
				return 'phone'
			}
			return 'audio'
		},

		callIconTooltip() {
			if (this.callIcon === 'audio') {
				return t('spreed', 'Joined with audio')
			} else if (this.callIcon === 'video') {
				return t('spreed', 'Joined with video')
			} else if (this.callIcon === 'phone') {
				return t('spreed', 'Joined via phone')
			} else if (this.callIcon === 'hand') {
				return t('spreed', 'Raised their hand')
			}
			return null
		},

		participantType() {
			return this.participant.participantType
		},

		sessionIds() {
			return this.participant.sessionIds || []
		},

		lastPing() {
			return this.participant.lastPing
		},

		attendeePin() {
			return this.participant.attendeePin ? this.readableNumber(this.participant.attendeePin) : ''
		},

		token() {
			return this.$store.getters.getToken()
		},

		currentParticipant() {
			return this.$store.getters.conversation(this.token) || {
				sessionId: '0',
				participantType: this.$store.getters.getUserId() !== null ? PARTICIPANT.TYPE.USER : PARTICIPANT.TYPE.GUEST,
			}
		},

		conversation() {
			return this.$store.getters.conversation(this.token) || {
				type: CONVERSATION.TYPE.GROUP,
			}
		},

		isBridgeBotUser() {
			return this.participant.actorType === ATTENDEE.ACTOR_TYPE.USERS
				&& this.participant.actorId === ATTENDEE.BRIDGE_BOT_ID
		},

		isSelf() {
			return this.sessionIds.length && this.sessionIds.indexOf(this.currentParticipant.sessionId) >= 0
		},

		selfIsModerator() {
			return this.participantTypeIsModerator(this.currentParticipant.participantType)
		},

		/**
		 * For now the user status is not overwriting the online-offline status anymore
		 * It felt too weird having users appear as offline but they are in the call or chat actively
		 * return this.participant.status === 'offline' ||  !this.sessionIds.length && !this.isSearched
		 */
		isOffline() {
			return !this.sessionIds.length && !this.isSearched
		},

		isGuest() {
			return [PARTICIPANT.TYPE.GUEST, PARTICIPANT.TYPE.GUEST_MODERATOR].indexOf(this.participantType) !== -1
		},

		isGroup() {
			return this.participant.actorType === ATTENDEE.ACTOR_TYPE.GROUPS
		},

		isModerator() {
			return this.participantTypeIsModerator(this.participantType)
		},

		showModeratorLabel() {
			return this.isModerator
				&& [CONVERSATION.TYPE.ONE_TO_ONE, CONVERSATION.TYPE.CHANGELOG].indexOf(this.conversation.type) === -1
		},

		canBeModerated() {
			return this.participantType !== PARTICIPANT.TYPE.OWNER
				&& !this.isSelf
				&& this.selfIsModerator
				&& !this.isBridgeBotUser
		},

		canBeDemoted() {
			return this.canBeModerated
				&& [PARTICIPANT.TYPE.MODERATOR, PARTICIPANT.TYPE.GUEST_MODERATOR].indexOf(this.participantType) !== -1
				&& !this.isGroup
		},

		canBePromoted() {
			return this.canBeModerated
				&& !this.isModerator
				&& !this.isGroup
		},

		preloadedUserStatus() {
			if (Object.prototype.hasOwnProperty.call(this.participant, 'statusMessage')) {
				// We preloaded the status when via participants API
				return {
					status: this.participant.status || null,
					message: this.participant.statusMessage || null,
					icon: this.participant.statusIcon || null,
				}
			}
			if (Object.prototype.hasOwnProperty.call(this.participant, 'status')) {
				// We preloaded the status when via search API
				return {
					status: this.participant.status.status || null,
					message: this.participant.status.message || null,
					icon: this.participant.status.icon || null,
				}
			}
			return undefined
		},

		attendeePermissions() {
			return this.participant.attendeePermissions
		},

		hasNonDefaultPermissions() {
			return this.attendeePermissions !== PARTICIPANT.PERMISSIONS.DEFAULT
		},

		actionIcon() {
			if (this.attendeePermissions === PARTICIPANT.PERMISSIONS.MAX_CUSTOM) {
				return 'LockOpenVariant'
			} else if (this.attendeePermissions === PARTICIPANT.PERMISSIONS.CUSTOM) {
				return 'Lock'
			} else if (this.attendeePermissions !== PARTICIPANT.PERMISSIONS.DEFAULT) {
				return 'Tune'
			}
			return ''
		},
	},

	methods: {
		updateUserNameNeedsTooltip() {
			// check if ellipsized
			const e = this.$refs.userName
			this.isUserNameTooltipVisible = (e && e.offsetWidth < e.scrollWidth)
		},

		updateStatusNeedsTooltip() {
			// check if ellipsized
			const e = this.$refs.statusMessage
			this.isStatusTooltipVisible = (e && e.offsetWidth < e.scrollWidth)
		},

		// Used to allow selecting participants in a search.
		handleClick() {
			if (this.isSearched) {
				this.$emit('click-participant', this.participant)
			}
		},

		participantTypeIsModerator(participantType) {
			return [PARTICIPANT.TYPE.OWNER, PARTICIPANT.TYPE.MODERATOR, PARTICIPANT.TYPE.GUEST_MODERATOR].indexOf(participantType) !== -1
		},

		async promoteToModerator() {
			await this.$store.dispatch('promoteToModerator', {
				token: this.token,
				attendeeId: this.attendeeId,
			})
		},

		async demoteFromModerator() {
			await this.$store.dispatch('demoteFromModerator', {
				token: this.token,
				attendeeId: this.attendeeId,
			})
		},

		async resendInvitation() {
			try {
				await this.$store.dispatch('resendInvitations', {
					token: this.token,
					attendeeId: this.attendeeId,
				})
				showSuccess(t('spreed', 'Invitation was sent to {actorId}.', { actorId: this.participant.actorId }))
			} catch (error) {
				showError(t('spreed', 'Could not send invitation to {actorId}', { actorId: this.participant.actorId }))
			}
		},

		async removeParticipant() {
			await this.$store.dispatch('removeParticipant', {
				token: this.token,
				attendeeId: this.attendeeId,
			})
		},

		grantAllPermissions() {
			try {
				this.$store.dispatch('grantAllPermissionsToParticipant', { token: this.token, attendeeId: this.attendeeId })
				showSuccess(t('spreed', 'Permissions granted to {displayName}', { displayName: this.computedName }))
			} catch (error) {
				showError(t('spreed', 'Could not modify permissions for {displayName}', { displayName: this.computedName }))
			}
		},

		removeAllPermissions() {
			try {
				this.$store.dispatch('removeAllPermissionsFromParticipant', { token: this.token, attendeeId: this.attendeeId })
				showSuccess(t('spreed', 'Permissions removed for {displayName}', { displayName: this.computedName }))
			} catch (error) {
				showError(t('spreed', 'Could not modify permissions for {displayName}', { displayName: this.computedName }))
			}
		},

		showPermissionsEditor() {
			this.permissionsEditor = true
		},

		hidePermissionsEditor() {
			this.permissionsEditor = false
		},

		applyDefaultPermissions() {
			try {
				this.$store.dispatch('setPermissions', { token: this.token, attendeeId: this.attendeeId, permissions: PARTICIPANT.PERMISSIONS.DEFAULT })
				showSuccess(t('spreed', 'Permissions set to default for {displayName}', { displayName: this.computedName }))
			} catch (error) {
				showError(t('spreed', 'Could not modify permissions for {displayName}', { displayName: this.computedName }))
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.selected {
	background-color: var(--color-primary-light);
	border-radius: 5px;
}

.participant-row {
	display: flex;
	align-items: center;
	cursor: default;
	margin: 4px 0;
	border-radius: var(--border-radius-pill);
	height: 56px;
	padding: 0 4px;

	&.isSearched {
		cursor: pointer;
	}

	&__user-wrapper {
		margin-top: -4px;
		margin-left: 12px;
		width: calc(100% - 100px);
		display: flex;
		flex-direction: column;

		&.has-call-icon {
			/** reduce text width to have some distance from call icon */
			padding-right: 5px;
			/** call icon on the right most column */
			width: calc(100% - 90px);
		}

		&.has-call-icon.has-menu-icon {
			/** make room for the call icon + menu icon */
			width: calc(100% - 124px);
		}
	}
	&__user-name,
	&__guest-indicator,
	&__moderator-indicator {
		vertical-align: middle;
		line-height: normal;
	}
	&__guest-indicator,
	&__moderator-indicator {
		color: var(--color-text-maxcontrast);
		font-weight: 300;
		padding-left: 5px;
	}
	&__user-descriptor {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	&__status {
		color: var(--color-text-maxcontrast);
		line-height: 1.3em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	&__icon {
		width: 44px;
		height: 44px;
		cursor: pointer;
	}
	&__utils {
		margin-right: 28px;
	}

	&__callstate-icon {
		opacity: .4;
		display: flex;
		align-items: center;
	}
}

.participant-row.isSearched .participant-row__user-name {
	cursor: pointer;
}

.utils {
	&__checkmark {
		margin-right: 11px;
	}
}

.offline {

	.participant-row__user-descriptor > span {
		color: var(--color-text-maxcontrast);
	}
}

</style>
