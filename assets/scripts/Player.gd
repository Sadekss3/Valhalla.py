extends CharacterBody2D

# Valhalla.py - Player Script
# Postać: Bjorn "Byte-Axe" - Viking warrior
# Mechanika: Poruszanie się strzałkami/WASD, kolizje ze ścianami

const SPEED = 200.0
const ANIMATION_SPEED = 0.1

@onready var sprite = $AnimatedSprite2D
@onready var collision = $CollisionShape2D

var current_direction = "down"
var is_moving = false

func _ready():
	# Inicjalizacja postaci
	if sprite:
		sprite.play("idle_down")
	set_collision_layer_value(1, true)
	set_collision_mask_value(1, true)

func _physics_process(delta):
	# Pobranie inputu
	var input_vector = Vector2.ZERO
	
	if Input.is_action_pressed("ui_right"):
		input_vector.x += 1
		current_direction = "right"
	if Input.is_action_pressed("ui_left"):
		input_vector.x -= 1
		current_direction = "left"
	if Input.is_action_pressed("ui_down"):
		input_vector.y += 1
		current_direction = "down"
	if Input.is_action_pressed("ui_up"):
		input_vector.y -= 1
		current_direction = "up"
	
	# Normalizacja wektora
	if input_vector != Vector2.ZERO:
		input_vector = input_vector.normalized()
		is_moving = true
	else:
		is_moving = false
	
	# Ustawienie prędkości
	velocity = input_vector * SPEED
	
	# Ruch z kolizjami
	move_and_slide()
	
	# Animacja
	update_animation()

func update_animation():
	if not sprite:
		return
	
	if is_moving:
		match current_direction:
			"up":
				sprite.play("walk_up")
			"down":
				sprite.play("walk_down")
			"left":
				sprite.play("walk_left")
			"right":
				sprite.play("walk_right")
	else:
		match current_direction:
			"up":
				sprite.play("idle_up")
			"down":
				sprite.play("idle_down")
			"left":
				sprite.play("idle_left")
			"right":
				sprite.play("idle_right")

func get_position_info() -> Dictionary:
	"""Zwraca informacje o pozycji postaci"""
	return {
		"x": global_position.x,
		"y": global_position.y,
		"direction": current_direction,
		"is_moving": is_moving
	}
