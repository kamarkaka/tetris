var result = new Array(),
	map = new Array(), block_pool = new Array(), block_color = new Array(),
	block, block_next, block_order = new Array(), block_next_order = new Array(),
	block_in_scene,
	gameplay,
	scores = new Array(), score_up,
	interval_handle, touch_interval_handle, touch_speed = 150,
	scene = document.getElementById("scene"),
	scene_next = document.getElementById("scene_next"),
	speed, speed_txt = document.getElementById("speed"),
	playback, playback_txt = document.getElementById("playback");

//initialize global variables
scores[0] = document.getElementById("scoreboard0");
score_up = 100;
speed = 750;
speed_txt.innerHTML = "EASY";
gameplay = true;
playback = true;
playback_txt.innerHTML = "PAUSE";
level = 0; level_max = 2;

block_pool[0] = [['0','0','0','0', '0','0','0','0', '0','0','0','0', 'B','B','B','B'], ['B','0','0','0', 'B','0','0','0', 'B','0','0','0', 'B','0','0','0']];
block_pool[1] = [['0','0','0','0', '0','0','0','0', 'B','B','0','0', 'B','B','0','0']];
block_pool[2] = [['0','0','0','0', '0','0','0','0', 'B','0','0','0', 'B','B','B','0'], ['0','0','0','0', 'B','B','0','0', 'B','0','0','0', 'B','0','0','0'], ['0','0','0','0', '0','0','0','0', 'B','B','B','0', '0','0','B','0'], ['0','0','0','0', '0','B','0','0', '0','B','0','0', 'B','B','0','0']];
block_pool[3] = [['0','0','0','0', '0','0','0','0', '0','0','B','0', 'B','B','B','0'], ['0','0','0','0', 'B','0','0','0', 'B','0','0','0', 'B','B','0','0'], ['0','0','0','0', '0','0','0','0', 'B','B','B','0', 'B','0','0','0'], ['0','0','0','0', 'B','B','0','0', '0','B','0','0', '0','B','0','0']];
block_pool[4] = [['0','0','0','0', '0','0','0','0', '0','B','B','0', 'B','B','0','0'], ['0','0','0','0', 'B','0','0','0', 'B','B','0','0', '0','B','0','0']];
block_pool[5] = [['0','0','0','0', '0','0','0','0', 'B','B','0','0', '0','B','B','0'], ['0','0','0','0', '0','B','0','0', 'B','B','0','0', 'B','0','0','0']];
block_pool[6] = [['0','0','0','0', '0','0','0','0', '0','B','0','0', 'B','B','B','0'], ['0','0','0','0', 'B','0','0','0', 'B','B','0','0', 'B','0','0','0'], ['0','0','0','0', '0','0','0','0', 'B','B','B','0', '0','B','0','0'], ['0','0','0','0', '0','B','0','0', 'B','B','0','0', '0','B','0','0']];
block_in_scene = false;

block_color[0] = "#00AFE4";
block_color[1] = "#FFD202";
block_color[2] = "#FF8E01";
block_color[3] = "#007BCB";
block_color[4] = "#74C425";
block_color[5] = "#FB4841";
block_color[6] = "#AB4AAB";

//get random number from given range
function get_rand(range){
	return Math.floor(range * Math.random(), 0);
}

//initialize map from given file
function load_map(url){
	var objXml = new XMLHttpRequest(),
		response_text = "",
		i = 0, j = 0, m_width = 0, m_height = 0,
		el_tr, el_td;
	objXml.open("GET", url, false);
	objXml.send(null);
	response_text = objXml.responseText;

	//transform map string to array
	map = response_text.split("\r\n");
	for(i = 0; i < map.length; i++){
		map[i] = map[i].split(" ");
	}

	//clear map
	for(i = scene.rows.length - 1; i >= 0; i--){
		scene.deleteRow(i);
	}

	//generate map
	for(i = 4; i < map.length; i++){
		el_tr = scene.insertRow(i - 4);
		for(j = 0; j < map[0].length; j++){
			el_td = el_tr.insertCell(j);
			if(map[i - 4][j] == '0'){ //empty block
				el_td.style.background = "white";
			}
			else if(map[i - 4][j] == '1'){ //occupied block
				el_td.style.background = "grey";
			}
		}
	}

	//reset game control
	scores[0].innerHTML = "0";
	gameplay = true;
	playback = true;
	playback_txt.innerHTML = "PAUSE";
}

//initialize block
function load_block(){
	var tmp, tmp2, el_tr, el_td, i, j;
	tmp = get_rand(block_pool.length);
	tmp2 = get_rand(block_pool[tmp].length);

	if(!block){
		block = block_pool[tmp][tmp2];
		block_order = [tmp, tmp2];
		
		tmp = get_rand(block_pool.length);
		tmp2 = get_rand(block_pool[tmp].length);
		block_next = block_pool[tmp][tmp2];
		block_next_order = [tmp, tmp2];
	}
	else{
		block = block_next;
		block_next = block_pool[tmp][tmp2];
		block_order = block_next_order;
		block_next_order = [tmp, tmp2];
	}
	
	//clear next block
	for(i = scene_next.rows.length - 1; i >= 0; i--){
		scene_next.deleteRow(i);
	}

	//generate next block
	for(i = 0; i < 4; i++){
		el_tr = scene_next.insertRow(i);
		for(j = 0; j < 4; j++){
			el_td = el_tr.insertCell(j);
			if(block_next[4*i+j] == '0'){ //empty block
				el_td.style.background = "white";
			}
			else{ //occupied block
				el_td.style.background = block_color[block_next_order[0]];
			}
		}
	}
}

//block moves down every single run, also determines if block should stop
function run_block(){
	var i, j, render_ok,
		k = 0, render = new Array(),
		map_height = map.length,
		map_width = map[0].length;

	//if currently there is a block moving
	if(block_in_scene){
		render_ok = true;
		for(i = map_height - 1; i >= 0; i--){
			for(j = 0; j < map_width; j++){
				if(map[i][j] == "B"){ //if current block is a moving block
					render[k++] = [i, j];
					if(i == map_height - 1) render_ok = false; //current block hits bottom
				}
				if(i > 0 && map[i-1][j] == "B"){ //if the block on top is a moving block
					if(map[i][j] == '1') render_ok = false; //if current block hits wall, stop rendering
				}
			}
		}
		
		if(render_ok){
			for(i = 0; i < render.length; i++){ //clear current block
				map[render[i][0]][render[i][1]] = "0";
				if(render[i][0] > 3){
					scene.rows[render[i][0] - 4].cells[render[i][1]].style.background = "white";
				}
			}
			for(i = 0; i < render.length; i++){ //render next block one pixel down
				map[render[i][0] + 1][render[i][1]] = "B";
				if(render[i][0] > 2){
					scene.rows[render[i][0] - 3].cells[render[i][1]].style.background = block_color[block_order[0]];
				}
			}
		}
		else{ //if block stops, make it wall
			for(i = 0; i < render.length; i++){
				map[render[i][0]][render[i][1]] = "1";
			}
			block_in_scene = false;
			
			for(i = 0; i < map_width; i++){
				if(map[3][i] == "1"){ //game over
					gameplay = false;
					alert("GAME OVER");
					playback_txt.innerHTML = "RESTART";
					break;
				}
			}
		}
		
	}
	else{ //if no block in scene, load new block
		load_block();
		
		for(i = 0; i < 4; i++){
			for(j = 3; j < 7; j++){
				map[i][j] = block[4*i+j-3];
			}
		}
		block_in_scene = true;
	}
}
//score board
function run_score(){
	var i, j, k,
		map_height = map.length,
		map_width = map[0].length,
		score_line = new Array, score = 0;

	for(i = 4; i < map_height; i++){ //find lines full of blocks
		score_line[i] = true;
		for(j = 0; j < map_width; j++){
			if(map[i][j] != "1") score_line[i] = false;
		}
		if(score_line[i]) score++;
	}

	if(score){
		score = (score - 1) * 20 + 10;
		scores[0].innerHTML = parseInt(scores[0].innerHTML) + score; //update score board

		//delete full-block lines
		for(i = 4; i < map_height; i++){
			if(score_line[i]){
				for(k = i; k > 4; k--){ //every line above the score line move one block down
					for(j = 0; j < map_width; j++){
						if(map[k-1][j] == "1"){
							map[k][j] = "1";
							scene.rows[k-4].cells[j].style.background = scene.rows[k-5].cells[j].style.background;
						}
						else{
							map[k][j] = "0";
							scene.rows[k-4].cells[j].style.background = "white";
						}
					}
				}
			}
		}
	}
}

//block movement
function block_move(direction){
	if(!gameplay || !playback) return false;
	var curr_block = new Array(), up_block = new Array(), new_block = new Array(),
		i, j, k = 0,
		map_height = map.length, map_width = map[0].length,
		move_ok,
		tmp, tmp0, tmp1, 
		right_point = 0, left_point = map_width, down_point = 0
		move_left = 0;

	//get positions of current running block
	for(i = 0; i < map_height; i++){
		for(j = 0; j < map_width; j++){
			if(map[i][j] == "B"){
				curr_block[k++] = [i, j];
				if(i > down_point) down_point = i;
				if(j < left_point) left_point = j;
			}
		}
	}

	if(direction == 0){
		//get rotated block
		tmp0 = block_order[0];
		if(block_order[1] + 1 == block_pool[block_order[0]].length) tmp1 = 0;
		else tmp1 = block_order[1] + 1;
		up_block = block_pool[tmp0][tmp1];

		move_ok = true; k = 0;
		for(i = down_point - 3; i <= down_point; i++){
			for(j = left_point; j <= left_point + 3; j++){
				tmp = 4 * (i + 3 - down_point) + j - left_point;
				if(up_block[tmp] == "B"){
					new_block[k++] = [i, j];
					if(map[i][j] == "1") move_ok = false;
				}
			}
		}
		block_order = [tmp0, tmp1];

		//get the rightmost point for new block
		for(i = 0; i < new_block.length; i++){
			if(new_block[i][1] > right_point) right_point = new_block[i][1];
		}
		if(right_point - map_width + 1 > 0) move_left = right_point - map_width + 1;
		else move_left = 0;
	}

	move_ok = true;
	for(i = 0; i < curr_block.length; i++){
		if(direction == 1){ //down
			if(curr_block[i][0] == map_height) move_ok = false; //block hits bottom
			else if(map[curr_block[i][0] + 1][curr_block[i][1]] == "1") move_ok = false; //block hits wall underneath
		}
		else if(direction == 2){ //left
			if(curr_block[i][1] == 0) move_ok = false; //block hits left border
			else if(map[curr_block[i][0]][curr_block[i][1] - 1] == "1") move_ok = false; //block hits left wall
		}
		else if(direction == 3){ //right
			if(curr_block[i][1] == map_width - 1) move_ok = false; //block hits right border
			else if(map[curr_block[i][0]][curr_block[i][1] + 1] == "1") move_ok = false; //block hits left wall
		}
	}

	if(move_ok){
		for(i = 0; i < curr_block.length; i++){ //clear current block
			map[curr_block[i][0]][curr_block[i][1]] = "0";
			if(curr_block[i][0] > 3) scene.rows[curr_block[i][0] - 4].cells[curr_block[i][1]].style.background = "white";
		}
		for(i = 0; i < curr_block.length; i++){ //render next block
			if(direction == 0){ //up
				map[new_block[i][0]][new_block[i][1] - move_left] = "B";
				if(new_block[i][0] > 3) scene.rows[new_block[i][0] - 4].cells[new_block[i][1] - move_left].style.background = block_color[block_order[0]];
			}
			else if(direction == 1){ //down
				map[curr_block[i][0] + 1][curr_block[i][1]] = "B";
				if(curr_block[i][0] > 2) scene.rows[curr_block[i][0] - 3].cells[curr_block[i][1]].style.background = block_color[block_order[0]];
			}
			else if(direction == 2){ //left
				map[curr_block[i][0]][curr_block[i][1] - 1] = "B";
				if(curr_block[i][0] > 3) scene.rows[curr_block[i][0] - 4].cells[curr_block[i][1] - 1].style.background = block_color[block_order[0]];
			}
			else if(direction == 3){ //right
				map[curr_block[i][0]][curr_block[i][1] + 1] = "B";
				if(curr_block[i][0] > 3) scene.rows[curr_block[i][0] - 4].cells[curr_block[i][1] + 1].style.background = block_color[block_order[0]];
			}
		}
	}
}

//key events
document.onkeydown = function(e){
	var ev = e || event;

	if(ev.keyCode == 87){ //up
		block_move(0);
	}
	else if(ev.keyCode == 83){ //down
		block_move(1);
	}
	else if(ev.keyCode == 65){ //left
		block_move(2);
	}
	else if(ev.keyCode == 68){ //right
		block_move(3);
	}
	else if(ev.keyCode == 82){ //R
		playback_txt.click();
	}
	else if(ev.keyCode == 48){ //0
		speed_txt.click();
	}
}

document.getElementById("arrow_up").ontouchstart = function(e){
	var ev = e || event;
	ev.preventDefault();
	block_move(0);
}
document.getElementById("arrow_down").ontouchstart = function(e){
	var ev = e || event;
	ev.preventDefault();
	block_move(1);
	if(touch_interval_handle) window.clearInterval(touch_interval_handle);
	touch_interval_handle = window.setInterval(function(){
		block_move(1);
	}, touch_speed / 2);
}
document.getElementById("arrow_left").ontouchstart = function(e){
	var ev = e || event;
	ev.preventDefault();
	block_move(2);
	if(touch_interval_handle) window.clearInterval(touch_interval_handle);
	touch_interval_handle = window.setInterval(function(){
		block_move(2);
	}, touch_speed);
}
document.getElementById("arrow_right").ontouchstart = function(e){
	var ev = e || event;
	ev.preventDefault();
	block_move(3);
	if(touch_interval_handle) window.clearInterval(touch_interval_handle);
	touch_interval_handle = window.setInterval(function(){
		block_move(3);
	}, touch_speed);
}
document.getElementById("arrow_up").ontouchend = function(){
	window.clearInterval(touch_interval_handle);
}
document.getElementById("arrow_down").ontouchend = function(){
	window.clearInterval(touch_interval_handle);
}
document.getElementById("arrow_left").ontouchend = function(){
	window.clearInterval(touch_interval_handle);
}
document.getElementById("arrow_right").ontouchend = function(){
	window.clearInterval(touch_interval_handle);
}

//pause/resume/restart button
playback_txt.onclick = function(){
	if(playback_txt.innerHTML == "PAUSE"){
		playback_txt.innerHTML = "RESUME";
		playback = false;
	}
	else if(playback_txt.innerHTML == "RESUME"){
		playback_txt.innerHTML = "PAUSE";
		playback = true;
	}
	else if(playback_txt.innerHTML == "RESTART"){
		load_map("map0.txt");
	}
}

//pick speed
speed_txt.onclick = function(){
	if(speed == 750){
		speed = 400;
		speed_txt.innerHTML = "NORMAL";
	}
	else if(speed == 400){
		speed = 100;
		speed_txt.innerHTML = "HARD";
	}
	else{
		speed = 750;
		speed_txt.innerHTML = "EASY";
	}
	
	window.clearInterval(interval_handle);
	interval_handle = window.setInterval(function(){
		if(playback && gameplay){
			run_block();
			run_score();
		}
	}, speed);
}

load_map("map0.txt");
load_block();
interval_handle = window.setInterval(function(){
	if(playback && gameplay){
		run_block();
		run_score();
	}
}, speed);