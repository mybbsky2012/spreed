<?php
declare(strict_types=1);

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

namespace OCA\Spreed\Controller;

// TODO
use OCA\Spreed\Exceptions\ParticipantNotFoundException;
use OCA\Spreed\Exceptions\RoomNotFoundException;
use OCA\Spreed\Manager;
use OCA\Spreed\Participant;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCS\OCSNotFoundException;
use OCP\AppFramework\OCSController;
use OCP\Files\FileInfo;
use OCP\Files\NotFoundException;
use OCP\IL10N;
use OCP\IRequest;
use OCP\IUser;
use OCP\IUserManager;
use OCP\Notification\IManager as NotificationManager;
use OCP\Share\Exceptions\ShareNotFound;
use OCP\Share\IManager as ShareManager;
use OCP\Share\IShare;

class PublicShareController extends OCSController {

	/** @var IUserManager */
	private $userManager;
	/** @var NotificationManager */
	private $notificationManager;
	/** @var ShareManager */
	private $shareManager;
	/** @var Manager */
	private $manager;
	/** @var IL10N */
	private $l10n;

	/**
	 * @param string $appName
	 * @param IRequest $request
	 * @param IUserManager $userManager
	 * @param NotificationManager $notificationManager
	 * @param ShareManager $shareManager
	 * @param Manager $manager
	 * @param IL10N $l10n
	 */
	public function __construct(
			$appName,
			IRequest $request,
			IUserManager $userManager,
			NotificationManager $notificationManager,
			ShareManager $shareManager,
			Manager $manager,
			IL10N $l10n
	) {
		parent::__construct($appName, $request);
		$this->userManager = $userManager;
		$this->notificationManager = $notificationManager;
		$this->shareManager = $shareManager;
		$this->manager = $manager;
		$this->l10n = $l10n;
	}

	/**
	 * @PublicPage
	 *
	 * TODO
	 * Creates a new room for requesting the password of a share.
	 *
	 * The new room is a public room associated with a "share:password" object
	 * with the ID of the share token. Unlike normal rooms in which the owner is
	 * the user that created the room these are special rooms always created by
	 * a guest or user on behalf of a registered user, the sharer, who will be
	 * the owner of the room.
	 *
	 * If there is already a room for requesting the password of the given share
	 * no new room is created; the existing room is returned instead.
	 *
	 * The share must have "send password by Talk" enabled; an error is returned
	 * otherwise.
	 *
	 * @param string $shareToken
	 * @return DataResponse the status code is "201 Created" if a new room is
	 *         created, "200 OK" if an existing room is returned, or "404 Not
	 *         found" if the given share was invalid.
	 */
	public function getRoom(string $shareToken) {
	error_log("Get room for $shareToken");
		// TODO remove?
		try {
			$share = $this->shareManager->getShareByToken($shareToken);
		} catch (ShareNotFound $e) {
			return new DataResponse([], Http::STATUS_NOT_FOUND);
		}
	error_log("Share found");

		$fileId = (string)$share->getNodeId();

		try {
			$room = $this->manager->getRoomByObject('file', $fileId);
		} catch (RoomNotFoundException $e) {
			try {
				$name = $this->getFileName($share, $fileId);
			} catch (NotFoundException $e) {
				throw new OCSNotFoundException($this->l->t('File is not shared, or shared but not with the user'));
			}
			$room = $this->manager->createPublicRoom($name, 'file', $fileId);
		}

// 		try {
// 			$room->getParticipant($this->currentUser);
// 		} catch (ParticipantNotFoundException $e) {
// 			$room->addUsers(['userId' => $this->currentUser]);
// 		}

		return new DataResponse([
			'token' => $room->getToken()
		]);

// 		try {
// 			$room = $this->manager->getRoomsForObject('share:public', $shareToken)[0];
// 		} catch (RoomNotFoundException $e) {
// 			return new DataResponse([], Http::STATUS_NOT_FOUND);
// 		}
// 	error_log("Room found");
// 
// 		return new DataResponse([
// 			'token' => $room->getToken(),
// 			'name' => $room->getName(),
// 			'displayName' => $room->getName(),
// 		]);
	}

	/**
	 * Returns the name of the file in the share.
	 *
	 * If the given share itself is a file its name is returned; otherwise the
	 * file is looked for in the given shared folder and its name is returned.
	 *
	 * @param IShare $share
	 * @param string $fileId
	 * @return string
	 * @throws NotFoundException
	 */
	private function getFileName(IShare $share, string $fileId): string {
		$node = $share->getNode();

		if ($node->getType() === FileInfo::TYPE_FILE) {
			return $node->getName();
		}

		$fileById = $node->getById($fileId);

		if (empty($fileById)) {
			throw new NotFoundException('File not found in share');
		}

		$file = array_shift($fileById);
		return $file->getName();
	}

}
