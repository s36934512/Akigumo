import { createMachine } from "xstate";

/**
 * Overlay 狀態機邏輯：
 * - closed: 初始狀態，等待滑鼠進入。
 * - opened: 彈窗開啟狀態。
 *   - opened.idle: 滑鼠在合法區域內。
 *   - opened.pendingClose: 滑鼠離開合法區域，進入 250ms 倒數。
 *     - 如果在倒數結束前再次進入，回到 idle 並自動取消倒數。
 *     - 如果倒數結束，回到外部的 closed 狀態。
 */
export const createOverlayMachine = (callbacks: {
	onOpen: () => void;
	onClose: () => void;
}) => {
	return createMachine({
		/** @xstate-layout N4IgpgJg5mDOIC5QHsBuYBOAbAhgTwDoBjLZWSAYgFkB5AVQGUBRAfSYDkAVJgJQG0ADAF1EoAA5kAlgBdJyAHaiQAD0QAOAGwB2AgK0BWAQIBMagJzGNatQEYANCDyJLxgmoFqAzMc8abnrT99DQBfEIc0TFxCAHccGUl5KAoAMRoeAGFWDIAZGmZBESQQCVgEhSVVBDUtHT1DE3NLa3tHRE8bV0MvH1sAFgstGy0wiPRsfAI4hKTqemYWHKYAQQA1JkKlUvLFYqqauoMjUwsrWwcnBF9XYw9vPoEbDQELM1GQSInY+NlZ5VhpDhpGACDgAGbAjAACgaAEoKJ9olMfokoJtittZBU9oh9MYLuobARPEYjDY8eY+rc3uEPuMkcgxGB5JQ0plsnkCsItlIsbtQFV9Fo+gQbJ1DAMaj4fASrvozG5PErjA8NJ4zEY1O9EZNGczIARJBAsGA5oxWEs1htuRjeXJ+SpnGKCLdSSSzGY+n1ybL1QICJ6PWYbCYtJ4+uZtfTdUyWRACLGIKiMqRyGaFhxuPwbeI7diBU6ia6jO7Pd79L7vS6Bh6PJYbD19FGojH9fHE8nU6b-oDgaCIZgocZDPCdYQ9XGE8yk0kU2QwOjc2U+ZVccLReKBJKtNLPL7-KKld5PLZ3B1Qu95MgIHAlGOecv7auEABaMyyl8XsYtwgkecQB8dmfYVXBqGszC0Mx7g0Cs2jlVwrGVPp9D6DRPSsZsvmRGYoEAlccQQEN9H0RVhQgtCahMX0BA0AgDB6Kl5R3DDaTHAgJ0gPCnwI9VZQbIlyVJJ59AbQIRlY6Nx1jA0jRNLj80daotErWioKQ5D-A6TCGWk9tp07ed5IdKoTxFBoS09fwhVaS5wwVPojxVDSlRsMIwiAA */
		id: "overlay",
		initial: "closed",
		states: {
			closed: {
				on: {
					MOUSE_ENTER: {
						target: "waiting",
					},
				},
			},
			waiting: {
				after: {
					800: { target: "opened" },
				},
				on: {
					FORCE_CLOSE: { target: "closed" },
					MOUSE_LEAVE: { target: "closed" },
				},
			},
			opened: {
				entry: () => callbacks.onOpen(),
				exit: () => callbacks.onClose(),
				initial: "idle",
				on: {
					// 無論在子狀態哪個位置，只要強制要求關閉
					FORCE_CLOSE: { target: "closed" },
				},
				states: {
					idle: {
						on: {
							MOUSE_LEAVE: { target: "pendingClose" },
						},
					},
					pendingClose: {
						after: {
							200: { target: "#overlay.closed" },
						},
						on: {
							MOUSE_ENTER: { target: "idle" },
						},
					},
				},
			},
		},
	});
};
