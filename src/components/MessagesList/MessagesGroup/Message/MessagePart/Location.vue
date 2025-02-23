<!--
  - @copyright Copyright (c) 2021 Marco Ambrosini <marcoambrosini@pm.me>
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
	<a
		:href="mapLink"
		target="_blank"
		rel="noopener noreferrer"
		class="location"
		:aria-label="linkAriaLabel">
		<LMap
			:zoom="previewZoom"
			:center="center"
			:options="{
				scrollWheelZoom: false,
				zoomControl: false,
				dragging: false,
				attributionControl: false,
			}"
			@scroll.prevent="">
			<LTileLayer :url="url" />
			<LControlAttribution
				position="bottomright"
				:prefix="attribution" />
			<LMarker :lat-lng="center">
				<LTooltip
					:options="{
						direction: 'top',
						permanent: 'true',
						offset: [-16,-14]}">
					{{ name }}
				</LTooltip>
			</LMarker>
		</LMap>
	</a>
</template>

<script>
import {
	LControlAttribution,
	LTooltip,
	LMap,
	LMarker,
	LTileLayer,
} from 'vue2-leaflet'

export default {
	name: 'Location',

	components: {
		LControlAttribution,
		LTileLayer,
		LMap,
		LMarker,
		LTooltip,
	},

	props: {
		/**
		 * The latitude of the location
		 */
		latitude: {
			type: String,
			required: true,
		},

		/**
		 * The longitude of the location
		 */
		longitude: {
			type: String,
			required: true,
		},

		/**
		 * The name of the location
		 */
		name: {
			type: String,
			default: '',
		},
	},

	data() {
		return {
			url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			// The zoom level of the map in the messages list
			previewZoom: 13,
			// The zoom level of the map in the new openstreetmap tab upon
			// Opening the link
			linkZoom: 18,

			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		}
	},

	computed: {
		center() {
			return [this.latitude, this.longitude]
		},

		mapLink() {
			return `https://www.openstreetmap.org/?mlat=${this.latitude}&mlon=${this.longitude}#map=${this.linkZoom}/${this.latitude}/${this.longitude}`
		},

		linkAriaLabel() {
			return t('spreed', 'Open this location in OpenStreetMap')
		},
	},
}
</script>

<style lang="scss" scoped>
.location {
	display: flex;
	flex-direction: column;
	position: relative;
	z-index: 1;
	white-space: initial;
	overflow: hidden;
	border-radius: var(--border-radius-large);
	height: 300px;
	max-height: 30vh;
	margin: 4px;
}
</style>
