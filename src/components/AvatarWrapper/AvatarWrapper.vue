<!--
  - @copyright Copyright (c) 2020 Marco Ambrosini <marcoambrosini@pm.me>
  -
  - @author Marco Ambrosini <marcoambrosini@pm.me>
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
	<div
		class="avatar-wrapper"
		:class="{'offline': offline}">
		<div
			v-if="iconClass"
			class="icon"
			:class="[`avatar-${sizeToString}px`, iconClass]" />
		<Avatar
			v-else-if="!isGuest"
			:user="id"
			:display-name="name"
			:menu-container="menuContainer"
			menu-position="left"
			:disable-tooltip="disableTooltip"
			:disable-menu="disableMenu"
			:show-user-status="showUserStatus"
			:show-user-status-compact="showUserStatusCompact"
			:preloaded-user-status="preloadedUserStatus"
			:size="size" />
		<div
			v-else
			class="guest"
			:class="`avatar-${sizeToString}px`">
			{{ firstLetterOfGuestName }}
		</div>
	</div>
</template>

<script>
import Avatar from '@nextcloud/vue/dist/Components/Avatar'

export default {

	name: 'AvatarWrapper',

	components: {
		Avatar,
	},

	props: {
		name: {
			type: String,
			default: null,
		},
		id: {
			type: String,
			default: null,
		},
		source: {
			type: String,
			default: null,
		},
		offline: {
			type: Boolean,
			default: false,
		},
		size: {
			type: Number,
			default: 32,
		},
		disableTooltip: {
			type: Boolean,
			default: false,
		},
		disableMenu: {
			type: Boolean,
			default: false,
		},

		showUserStatus: {
			type: Boolean,
			default: true,
		},
		showUserStatusCompact: {
			type: Boolean,
			default: true,
		},
		preloadedUserStatus: {
			type: Object,
			default: undefined,
		},
	},
	computed: {
		// Determines which icon is displayed
		iconClass() {
			if (!this.source || this.source === 'users' || this.isGuest) {
				return ''
			}
			if (this.source === 'emails') {
				return 'icon-mail'
			}
			// source: groups, circles
			return 'icon-contacts'
		},
		isGuest() {
			return this.source === 'guests'
		},
		firstLetterOfGuestName() {
			const customName = this.name !== t('spreed', 'Guest') ? this.name : '?'
			return customName.charAt(0)
		},
		menuContainer() {
			return this.$store.getters.getMainContainerSelector()
		},
		// Takes the the size prop and makes it a string for the classes
		sizeToString() {
			return this.size.toString()
		},
	},
}
</script>

<style lang="scss" scoped>
@import '../../assets/avatar';

.avatar-wrapper {
	$avatar-size: 44px;
	height: $avatar-size;
	width: $avatar-size;
	@include avatar-mixin($avatar-size);
}

.offline .avatar-wrapper .avatardiv {
	background: rgba(255, 255, 255, .4) !important;

	::v-deep > img {
		opacity: .4 !important;
	}
}

body.theme--dark {
	.offline .avatar-wrapper .avatardiv {
		background: rgba(0, 0, 0, .4) !important;
		margin-top: -4px;
	}
}

</style>
