
/**        DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *                   Version 2, December 2004
 *
 * Copyright (C) 2021 Matthias Gatto <matthias.gatto@protonmail.com>
 *
 * Everyone is permitted to copy and distribute verbatim or modified
 * copies of this license document, and changing it is allowed as long
 * as the name is changed.
 *
 *            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *  TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
 *
 *  0. You just DO WHAT THE FUCK YOU WANT TO.
 */

/* 
 * I've try to use this file as an example how to use my engine with js and canvas.
 * most of my engine use an abstract type call entity, that are use to represent any kind of data
 * and are used everywhere in my engine and games.
 * small detail array entity elements, can be access using integer or string as key
 * The engine also have a widget system, where everything on screen is a widget.
 * API documentation are still in the C header, you can find at:
 * https://github.com/cosmo-ray/yirl/blob/master/include/yirl
 * For this files most of the function used came from:
 * widget.h : widgets manipulation (not used too much in this file)
 * canvas.h : canvas manipulation, use for most thing you see on screen
 * entity.h : entity manipulation
 * game.h : global game bahavior, and refresh every widgets
 * pos.h: create and manipulate pos(X/Y) and Size(W/H)
 * rect.h: create and manipulate rect
 * texture.h: rendable elements (that are not rend yet) used to create card
 * Stat reading the code at mod_init so at the end of the file :)
 */

let CARD_W = 200 /* card width in pixiel, why are you still reading this you should go tp mod_init */
let CARD_H = 300 /* card height in pixiel, GO TO mod_init */

/* thoses helper are set and used in paw_action (and sub function called by it) */
var cp = null /* current player */
var op = null /* other player */
var cpd = null /* current player deck */
var cph = null /* current player hand */
var cpf = null /* current player field */
var card_rotation = 0 /* 0 for player, 180 for enemy, is set at turn start */

var looser = 0 /* who lose (0 no one) */

var non_playable_cause = null /* string that store why a card can't be played */

var slash_path = "./slash.png"

/*
 * simple helper: yeGetInt, get number from an Int Entity
 * yeGet: get sub entity of an array entity
 * this function get an integer from an elements of an array
 * @return interger value of sub elemt of e at k 
 */
function i_at(e, k)
{
    return yeGetInt(yeGet(e, k))
}

/* 
 * Addition an integer to an element of an array entity
 * like e[k] += v but e is an entity.
 * we can't directly use e[k], because js binding try to 1/1 binding with C functions
 * it should be posible to have an orianted object wrapper of YIRL API. but it need to be done,
 * and it need to be done diferently for each scripting languages
 */
function add_i_at(e, k, v)
{
    yeAddInt(yeGet(e, k), v)
}

/* 
 * remove "hover_c" from screen and paw widget entity
 * hover_c is the card show in big when you have
 * your mouse over a card on the field
 */
function deprint_card(paw)
{
    if (yeGet(paw, "hover_c") != null) {
	ywCanvasRemoveObj(paw, yeGet(paw, "hover_c"))
	yeRemoveChildByStr(paw, "hover_c")
    }
}

/* show a slash on screen, wait and remove it */
function slash(paw, x, y)
{
    /* create canvas obj using slash_path */
    var slash = ywCanvasNewImgByPath(paw, x, y, slash_path);

    /* ask YIRL to rend all widget (and thefore print objects that have been push to the canvas) */
    ygUpdateScreen()
    /* wait */
    yuiUsleep(300000)
    /* remove the image and reprint all */
    ywCanvasRemoveObj(paw, slash);
    ygUpdateScreen()
}

/* remove card from battle field and screen */
function rm_card(paw, f, c)
{
    /* get canvas obj from card */
    let can = yeGet(c, "can")
    /* get pos */
    let pos = ywCanvasObjPos(can)

    /* show a slash to explicit the card attack */
    slash(paw, ywPosX(pos), ywPosY(pos))
    /* remove object from screen */
    ywCanvasRemoveObj(paw, can)
    /* remove card entity from field entity */
    yeRemoveChildByEntity(f, c)
    /* update screen */
    ygUpdateScreen()
    yuiUsleep(300000)
}

/* try to attack with a card */
/* if the card is tap, return */
/* else try to find if the oponent have an untap card */
/* if so attack the untap card */
/* else go for the eye... enemy life, Boo...m (but I'm listening to BG ost) */
function attack(paw, card)
{
    if (i_at(card, "tap") == 1)
	return

    /* get card canvas */
    var can = yeGet(card, "can")

    /* remove useless info on screen (it time to fight now) */
    deprint_card(paw)

    /* tap the card */
    yeSetIntAt(card, "tap", 1)
    ywCanvasRotate(can, card_rotation + 90)

    ygUpdateScreen()
    yuiUsleep(300000)

    var atk_val = i_at(card, "atk")
    var def_val = i_at(card, "def")
    /* get other player field (so that guy under attack) */
    var opf = yeGet(op, "field")
    var defender = null

    /* try to find an untap defenders in enemy field */
    for (var i = 0; i < yeLen(opf); ++i) {
	ocard = yeGet(opf, i)
	if (ocard && i_at(ocard, "tap") == 0) {
	    defender = ocard
	    break
	}
    }

    /* if no defenders, then we remove citizens (which are life in this game) */
    if (defender == null) {
	add_i_at(op, "citizens", -atk_val)
	print("cur player: !!!! ", i_at(paw, "cur_player"),
	      i_at(paw, "cur_player") == 1)
	/* slash the attacked player deck */
	if (i_at(paw, "cur_player") == 1)
	    slash(paw, 660, 420)
	else
	    slash(paw, 30, 0)
    } else {
	/* get attack and defend value of attacked card */
	aat = i_at(defender, "atk")
	adt = i_at(defender, "def")

	/* kill other card if attack > def, both cards can die */
	if (aat >= def_val) {
	    rm_card(paw, cpf, card)
	}
	if (atk_val >= adt) {
	    rm_card(paw, opf, defender)
	}
    }
}

function draw_card(paw)
{
    /* if all card have been draw, the player lose  */
    if (yeLen(cpd) == 0) {
	looser = i_at(paw, "cur_player") + 1
	return
    }

    /* get last card from deck */
    var card = yeLast(cpd)
    /* if hand is full return */
    if(yeNbElems(cph) > 7)
	return
    /* get card name (which is the array key) */
    var name = yeLastKey(cpd)
    /* push card into hand, use name as key */
    var hidx = yePush(cph, card, name)
    var x = 30
    var angle = 0
    var wm = 1
    /* remove last card from deck */
    yePopBack(cpd)

    /*
     * depeding of whatever it's the player or the enemy,
     * get texture of the back of the card, or the front,
     * and give the good angle to the card
     */
    let txt = null
    if (i_at(paw, "cur_player") == 0) {
	txt = yeGet(card, "texture") /* get card texture */
	angle = 10 * hidx - 30
    } else {
	angle = 210 - 15 * hidx
	txt = mk_card_back() /* card back texture */
	x += 400
	wm = -1
    }
    /* make canvas object from texture */
    var can = ywCanvasNewImgFromTexture(paw, x + 30 * hidx,
					i_at(cp, "hand_y"), txt,
					null)
    ywCanvasRotate(can, angle) /* rotate */
    /* set size */
    ywCanvasForceSizeXY(can, CARD_W / 2, CARD_H / 2)
    print("weight: ", x + 30 * hidx)
    /* set the card so it appear above card on the field */
    ywCanvasSetWeight(paw, can, (hidx + 1) * wm)
    yePushBack(card, can, "can") /* push the canvas obj in the card */
    yeCreateInt(hidx, can, "hidx") /* push the hand int index of the card in the canvas */
    yeCreateString(name, card, "name") /* name of the card in the card */
    ygUpdateScreen()
}

function phase_to_str(phase)
{
    if (phase == 0)
	return "unkeep phase"
    else if (phase == 1)
	return "main phase"
    return "unknow phase"
}

/*
 * check if a card can be played, and set the reason
 * why it can in non_playable_cause
 */
function is_card_playable(scard, wealth)
{
    if (scard == null)
	return false
    let wc = i_at(scard, "wealth_cost")

    if (i_at(scard, "type") == 0 && yeNbElems(cpf) > 6) {
	non_playable_cause = "TOO MUCH GUYS ON THE FIELD"
	return false
    }
    non_playable_cause = "NOT ENOUGH WEALTH :("
    return wc <= wealth
}

/*
 * printf a big version of the card, on top left of the widget
 * call hover, because this function should be call when
 * the mouse is over a card
 */
function print_card(paw, scard)
{
    var txt = yeGet(scard, "texture")
    var hover_c = ywCanvasNewImgFromTexture(paw, 0, 0, txt, null)

    yePushBack(paw, hover_c, "hover_c")
}

/* play a card (from hand to field) */
function play_card(paw, scard)
{
    var hcan = yeGet(scard, "can")
    let wc = i_at(scard, "wealth_cost")
    let cc = i_at(scard, "citizen_cost")

    ywCanvasRemoveObj(paw, hcan)
    yeRemoveChildByStr(scard, "can")
    yeRemoveChildByStr(scard, "hidx")
    print("oh: ", i_at(cp, "wealth"))
    add_i_at(cp, "wealth", -wc)
    add_i_at(cp, "citizens", -cc)
    if (i_at(scard, "type") == 1) {
	add_i_at(cp, "wealth-turn", i_at(scard, "gen_wealth"))
    } else if (i_at(scard, "type") == 0) {
	var fidx = yePush(cpf, scard)
	let txt = yeGet(scard, "texture")

	var can = ywCanvasNewImgFromTexture(paw, 110 * fidx + 3,
					    i_at(cp, "field_y"), txt,
					    null)
	ywCanvasForceSizeXY(can, CARD_W / 2, CARD_H / 2)
	ywCanvasRotate(can, card_rotation)
	ywCanvasSetWeight(paw, can, 0)
	yeCreateInt(fidx, can, "fidx")
	yePushBack(scard, can, "can")
    }

    yeRemoveChildByEntity(cph, scard)
}

/* this function is automatically called by YIRL,
 * there is 2 paradigme YIRL can use to rend object:
 *
 * 1rst is to use how widget should work:
 * each widgets have an action callbback, which take in parameters game events
 * modify what the widget sould print.
 * all callbacks are called then YIRL print all widgets, and re call the callback
 * (basically YIRL have a loop that call, action callbacks and print everything)
 *
 * 2nd paradigme: 1 widget take ownershit of the screen:
 * the action callback is called a first time, but them the callback doesn't
 * return durring all the widget lifecycle and monopolise the screen.
 * this widget do kind of an old mix of both:
 * it monopolise the screen durring enemy turn, and when animation happen,
 * but use the normal way of returning to get events
 */
function paw_action(paw, eves)
{
    /*
     * create a retangle entity, that corespond to mouse cursor (with a size of 1,1)
     * this rectangle will be used to check colision with a card in the hand
     */
    let mouse_r = ywRectCreateInts(yeveMouseX(), yeveMouseY(), 1, 1)
    /* store information in the paw widgets into js variables */
    let phase = i_at(paw, "phase")
    let cur_player = i_at(paw, "cur_player")
    let turn = i_at(paw, "turn")
    let p0 = yeGet(paw, "p0")
    let p1 = yeGet(paw, "p1")

    /* set some global variables depending on who's playing */
    if (cur_player == 0) {
	card_rotation = 0
	cp = p0
	op = p1
    } else {
	card_rotation = 180
	cp = p1
	op = p0
    }
    cpd = yeGet(cp, "deck")
    cph = yeGet(cp, "hand")
    cpf = yeGet(cp, "field")
    
    /* set some js variable from current player */
    var wealth = i_at(cp, "wealth")
    var citizens = i_at(cp, "citizens")
    /* global txt is use to give game info to the player */
    var global_txt = "Turn: " + turn + " Player: " + cur_player +
	" " + phase_to_str(phase) +
	"\nGood Guy: Wealth: " + i_at(p0, "wealth") +
	" Pop: " + i_at(p0, "citizens") +
	" Income: " + i_at(p0, "wealth-turn") +
	"\nBad Guy: Wealth: " + i_at(p1, "wealth") +
	" Pop: " + i_at(p1, "citizens") +
	" Income: " + i_at(p1, "wealth-turn")

    /* phase == 0 mean unkeep */
    if (phase == 0) {
	/* if it's first turn, draw 7 card, 1 otherwise */
	if (turn == 0)
	    for(var i = 0; i < 5; ++i) {
		draw_card(paw)
		/* small sleep so you draw you card 1 by 1 */
		ygUpdateScreen()
		yuiUsleep(30000)
	    }
	else
	    draw_card(paw)
    }

    /* if a city (player) run out of citizen (life), he die */
    if (i_at(p0, "citizens") < 1)
	looser = 2;
    else if (i_at(p1, "citizens") < 1)
	looser = 1;

    /* if looser is not 0, we have a winner */
    if (looser > 0) {
	 /* print who win, wait and quit */
	let txt = "Player " + (looser - 1) + " WIN !!!"
	ywCanvasNewTextByStr(paw, 200, 200, txt)
	ywCanvasNewTextByStr(paw, 200, 260, txt)
	ywCanvasNewTextByStr(paw, 200, 340, txt)
	ygUpdateScreen()
	yuiUsleep(2000000)
	/* if the widget entity contain an element call "quit" */
	if (yeGet(paw, "quit"))
	    yesCall(yeGet(paw, "quit"), paw) /* this callback is used to destroy the widget */
	else
	    yesCall(ygGet("FinishGame")) /* kill YIRL othervise */
	return;
    }

    /* unkeep */
    if (phase == 0) {
	/* untap all card */
	for (var i = 0; i < yeLen(cpf); ++i) {
	    let card = yeGet(cpf, i)

	    yeSetIntAt(card, "tap", 0)
	    let can = yeGet(card, "can")
	    ywCanvasRotate(can, card_rotation)
	}
	/* give wheal to current player, and increase phase */
	add_i_at(cp, "wealth", i_at(cp, "wealth-turn"))
	add_i_at(paw, "phase", 1)
    }

    /* if it's bad guy turn, do AI */
    if (i_at(paw, "cur_player") == 1) {
	print("play le mechant")
	print("AI, yume no ai")
	yuiUsleep(100000)
	ygUpdateScreen()

	/* play every card, the bad guy can play from his hand */
	for (var i = 0; i < yeLen(cph); ++i) {
	    var scard = yeGet(cph, i)
	    print("playable: ", is_card_playable(scard, wealth))
	    if (is_card_playable(scard, i_at(cp, "wealth"))) {
		play_card(paw, scard)
	    }
	}

	/* for each card on the fiel, trow a 2 face dice, if 1, attack ! */
	for (var i = 0; i < yeLen(cpf); ++i) {
	    var card = yeGet(cpf, i)

	    if (card && i_at(card, "tap") < 1 && yuiRand() & 1) {
		attack(paw, card)
	    }
	}

	/* you can't accumulate whealth over turn */
	yeSetIntAt(cp, "wealth", 0)
	add_i_at(paw, "turn", 1) /* increase turn number by one */
	yeSetIntAt(paw, "phase", 0) /* unkeep phase */
	yeSetIntAt(paw, "cur_player", 0) /* set current player to 0 */

	return; /* END of AI, return, it's now player turn */
    }

    /* if an events of type mouse down (click) occure
     * and the mouse position colide with the current player deck
     * print: "deck click" with len of player deck, enemy deck, and next card name
     * yeap, the one paying in a terminal can shit
     */
    if (yevCheckKeys(eves, YKEY_MOUSEDOWN, 1) &&
	ywCanvasCheckColisionsRectObj(mouse_r, yeGet(cp, "deck_c"))) {
	print("deck click !", yeLen(cpd), yeLen(cph),
	      yeLastKey(cpd), yeLastKey(cph))
    }

    /* in case a card was hover, it's now remove from the screen */
    deprint_card(paw)

    /* get an entity array of all canvas objects that colide with mouse */
    let cols = ywCanvasNewCollisionsArrayWithRectangle(paw, mouse_r)

    /* for each of the objects that colide with mouse: store cols[i] in c */
    for (var i = 0; (c = yeGet(cols, i)) != null; ++i) {
	/* if c contain a field call "turn-end" then ther's a click on the "turn-end" rectangle */
	if (yeGet(c, "turn-end") && yevCheckKeys(eves, YKEY_MOUSEDOWN, 1)) {
	    yeSetIntAt(paw, "phase", 0) /* unkeep phase */
	    yeSetIntAt(paw, "cur_player", 1) /* current player is bad player */
	    yeSetIntAt(cp, "wealth", 0) /* reset wealth (don't accumulate) */
	    return
	}
    }

    /* get the card the most on top of the screen under the mouse */
    /* so if the mouse is over a card on the field and 1 in the hand */
    /* only the one in the hand will be manipulate */
    let hover_card = yeLast(cols)

    /* if hover card exist, contain a fiel "hidx" and */
    /* mouse is in the bottom of the screen */
    /* then it mean the mouse if over a card in player hand */
    if (hover_card != null && yeGet(hover_card, "hidx") != null &&
	yeveMouseY() > 300) {
	/* This one is a little tricky: */
	/* hover_card is not the entity of the card, */ 
	/* but the entity of the canvas object of the card */
	/* so the thing that can be print on screen by yirl */
	/* when we push this canvas obj in the screen (in draw_card function) */
	/* we push an integer in the canvas obj */
	/* that int serve as index of the real card in the hand */
	/* we could have push the card in the canvas object directly */
	/* but that would have create a circular reference */
	/* which are allow, but require manual operation to avoid a leak */
	var scard = yeGet(cph, i_at(hover_card, "hidx"))

	/* print a big version of this card, so the player have more information */
	/* about the card under his mouse */
	print_card(paw, scard)

	/* if a click have been made the card under the mouse is played */
	if (yevCheckKeys(eves, YKEY_MOUSEDOWN, 1)) {
	    if (is_card_playable(scard, wealth)) {
		play_card(paw, scard)
	    } else {
		global_txt += "\n" + non_playable_cause
	    }
	} /* same check as for card in the hand, but for card on the field */
    } else if (hover_card != null && yeGet(hover_card, "fidx") != null &&
	       yeveMouseY() > 300) {
	 /* same trick as with hidx but with fidx (field idx) */
	var scard = yeGet(cpf, i_at(hover_card, "fidx"))

	/* print zoomed version of the card */
	print_card(paw, scard)
	/* if click, try to attack */
	if (yevCheckKeys(eves, YKEY_MOUSEDOWN, 1)) {
	    attack(paw, scard)
	}
    /* if the mouse is over a card in the enemy field, we print a bog version of it */
    } else if (hover_card != null && yeGet(hover_card, "fidx") != null) {
	var scard = yeGet(yeGet(p1, "field"), i_at(hover_card, "fidx"))

	print_card(paw, scard)
    }

    /* remove old global info from screen */
    ywCanvasRemoveObj(paw, yeGet(paw, "global_text"))
    /* remove the field "global_text" from widget entity */
    yeRemoveChildByStr(paw, "global_text")
    /* push global_txt (which contain actual global info) into screen */
    let global_txt_c = ywCanvasNewTextByStr(paw, 200, 0, global_txt)
    /* and into paw widget entity in the fiel "global_text" */
    yePushBack(paw, global_txt_c, "global_text")
}

/* create back card texture */
function mk_card_back(father, name)
{
    let sz = ywSizeCreate(CARD_W, CARD_H)
    let ret = ywTextureNew(sz, father, name)

    ywTextureMergeRectangle(ret, 0, 0, CARD_W, CARD_H,
			    "rgba: 0 0 0 255")
    ywTextureMergeRectangle(ret, 2, 2, CARD_W - 4, CARD_H - 4,
			    "rgba: 127 30 70 255")
    ywTextureMergeText(ret, 30, 130, CARD_W, 30, "Polis At War")
    return ret
}

/*
 * This function should be callable from outside of the module
 * Take a card description and return create image of it
 */
function mk_card(card, card_name)
{
    /* create card size entity, from CARD_W and CARD_H global variable */
    let sz = ywSizeCreate(CARD_W, CARD_H)
    /* create a rectangle entity that will serve as the dest where the card image is put in the texture */
    let imd_dst = ywRectCreateInts(25, 40, 150, 150)
    /* create an empty texture, set it's size, */
    /* push it into card entity ("texture" is the field key) */
    /* this texture will be the card texture, and as the variable name could show: */
    /* it's the returned variable of this function */
    var ret = ywTextureNew(sz, card, "texture")
    /* some few function in js return entities that are not automatically free */
    /* so we use an array that will be free, when out of scope, as so it's childs */
    var gc_crasp = yeCreateArray()
    /* card name must be the same as it's image file name */
    let img_path = card_name + ".png"
    var cost = ""

    /* black border */
    ywTextureMergeRectangle(ret, 0, 0, ywSizeW(sz), ywSizeH(sz),
			    "rgba: 0 0 0 255")
    /* card color is grey */
    ywTextureMergeRectangle(ret, 2, 2, ywSizeW(sz) - 4, ywSizeH(sz) - 4,
			    "rgba: 127 127 127 255")

    /* create a texture from img_path */
    var itxt = ywTextureNewImg(img_path, null, gc_crasp, null)
    /* merge itxt into ret */
    ywTextureMergeTexture(itxt, ret, null, imd_dst)
    /* if this image cost wealth, append it to the cost js string */
    if (i_at(card, "wealth_cost"))
	cost += i_at(card, "wealth_cost") + "$ "
    /* if this image cost citizen, append it to the cost js string */
    if (i_at(card, "citizen_cost"))
	cost += i_at(card, "citizen_cost") + "Citizens"
    /* merge cost string into ret texture, position x: 4 y: 20 */
    ywTextureMergeText(ret, 4, 20, CARD_W, 30, cost)

    /* check if card is a monster */
    if (i_at(card, "type") == 0) {
	let atk_txt = i_at(card, "atk") + " / " + i_at(card, "def")
	
	/* push atk and def value in the card texture */
	ywTextureMergeText(ret, 130, 270, 70, 30,  atk_txt)
    } else if (i_at(card, "type") == 1) { /* type 1 mean it's a card that generate resources */
	let income_txt = "increase income: " + i_at(card, "gen_wealth")

	/* push into the card text that indicate how much income it will generate */
	ywTextureMergeText(ret, 5, 210, 70, 30,  income_txt)
    }

    /* 0 mean untap */
    yeCreateInt(0, card, "tap")
    /* merge card name into card texture */
    ywTextureMergeText(ret, 4, 2, CARD_W, 30, card_name)
    return ret
}

function create_player(paw, name, deck)
{
    /* create player entity */
    var p = yeCreateArray(paw, name)

    /* create player deck, hand, graveyard, field, wealth, wealth generated by turn, and citizens (life) */
    var p_deck = yeCreateArray(p, "deck")
    yeCreateArray(p, "hand")
    yeCreateArray(p, "graveyard")
    yeCreateArray(p, "field")
    yeCreateInt(0, p, "wealth")
    yeCreateInt(1, p, "wealth-turn")
    yeCreateInt(20, p, "citizens")

    /* get global card list from the widget entity */
    var cards = yeGet(paw, "cards")
    /* create a copy of deck (the function parameter) */
    var cp_deck = yeCreateCopy(deck)
    var tot_cards = 0
    for (i = 0; i < yeLen(cp_deck); ++i) {
	var cards_nb = yeGet(cp_deck, i)
	tot_cards += yeGetInt(cards_nb)
    }

    while (tot_cards > 0) {
	var deck_idx = yuiRand() % yeLen(cp_deck)
	var cards_nb = yeGet(cp_deck, deck_idx)

	if (yeGetInt(cards_nb) > 0) {
	    let cname = yeGetKeyAt(cp_deck, deck_idx)
	    yeAddInt(cards_nb, -1)
	    tot_cards--;
	    let ocard = yeGet(cards, cname)
	    let copy = yeCreateCopy(ocard, p_deck, cname)
	    let copy_txt = yeGet(copy, "texture")
	    ocard_txt = yeGet(ocard, "texture")
	    yePushBack(copy_txt, yeGet(ocard_txt, "$img-surface"), "$img-surface")
	}
    }
    return p
}

function paw_destroy(paw)
{
    ygModDirOut();
}

/* take the widget array entity, and init it */
function paw_init(paw)
{
    /* go to the module directory, useful to use images dynamoc paths */
    ygModDir("polis-at-war");
    /* create destroy and action function the widget */
    yeCreateFunction(paw_destroy, paw, "destroy")
    yeCreateFunction(paw_action, paw, "action")
    /* set background color, note, that background could have an image path too */
    yeCreateString("rgba: 255 255 255 255", paw, "background")
    /* load the json containing the cards description into cards variable */
    var cards = ygFileToEnt(YJSON, "./cards.json")
    /* push cards into the widget */
    yePushBack(paw, cards, "cards")
    /* load the deck descriptions */
    var deck = ygFileToEnt(YJSON, "./greek_deck.json")

    /* create the entity, tell YIRL the entity is based on the canvas type
     * (so yirl will call canvas init internaly) */
    ret = ywidNewWidget(paw, "canvas")
     /* enable weight on the widget, otherwise we couldn't choose which object is on top of another */
    ywCanvasEnableWeight(paw)
    
    /* create a line that server as separation for the players */
    ywCanvasNewRectangle(paw, 0, 300, 800, 1, "rgba: 0 0 0 100")

    /* init all cards */
    for (i = 0; i < yeLen(cards); ++i) {
	let img_path = yeGetKeyAt(cards, i) + ".png"
	mk_card(yeGet(cards, i), yeGetKeyAt(cards, i))
	/* debug print */
	var img = null
	var imgt = yeGet(yeGet(cards, i), "texture")

	print("=====\n", yent_to_str(imgt), "\n====")
	//img = ywCanvasNewImgFromTexture(paw, 10, i * 110, imgt, null)
	//ywCanvasForceSize(img, sz)


    }
    /* get widget pixiel size from widget array entity */
    var wid_size = yeGet(paw, "wid-pix")
    /* get height and width from wid_size */
    var wid_h = ywRectH(wid_size)
    var wid_w = ywRectW(wid_size)
    /* create back of the card texture */
    let back = mk_card_back()
    var sz = ywSizeCreate(CARD_W / 2, CARD_H / 2)

    /* init some value and push thoses into the widget entity */
    yeCreateInt(0, paw, "turn")
    yeCreateInt(0, paw, "phase")
    yeCreateInt(0, paw, "cur_player")

    /* create p1 (the bad guy) return an entity entity that have been push into paw */
    var p = create_player(paw, "p1", deck)

    /*
     * create a printable object from back (which is a texture)
     * Position of the object are x: 30, y: 0, it reprsent the deck of the player
     */
    var back_c = ywCanvasNewImgFromTexture(paw, 30, 0, back, null)
    /* set the size of the object */
    ywCanvasForceSize(back_c, sz)
    /* U turn */
    ywCanvasRotate(back_c, 180)
    /* push the canvas obj into player entity, so it will be easier to manipulate it */
    yePushBack(p, back_c, "deck_c")
    yeCreateInt(10, p, "hand_y")
    yeCreateInt(130, p, "field_y")

    /* create the good guy */
    p = create_player(paw, "p0", deck)
    yeCreateInt(420, p, "hand_y")
    yeCreateInt(310, p, "field_y")
    back_c = ywCanvasNewImgFromTexture(paw, 660, 420, back, null)
    ywCanvasForceSize(back_c, sz)
    yePushBack(p, back_c, "deck_c")
    /* ^ same as for the bag guy, but for the good guy */

    /* Create a rectangle, and a text canvas object, in order to create a butter to end turn */
    var end_turn = ywCanvasNewRectangle(paw, 700, 10, 80, 80, "rgba: 255 0 0 190")
    ywCanvasNewTextByStr(paw, 700, 35, "End Turn")
    yeCreateInt(1, end_turn, "turn-end")

    return ret; /* now go to paw_action, it will be automatically called by YIRL */
}

/* module starting point
 * mod is an array entity representing the module
 */
function mod_init(mod)
{
   /*
    * create an array entity that will be use to define a new
    * type of widget call "polis-at-war"
    */
    var paw = yeCreateArray()

    /*
     * create a function entity that have as value the js function "paw_init"
     * push it into paw array, with "callback" as key
     */
    yeCreateFunction(paw_init, paw, "callback")
     /* create an entity string "polis-at-war", push it into paw, "name" as array key */
    yeCreateString("polis-at-war", paw, "name")
     /* Crappy internal uglyness */
    yeIncrRef(paw)
     /* tell YIRL that a new sub widget type existe
      * it's define by paw variable
      * the new type is call "polis-at-war", and when a widget of that sub-type
      * is created paw_init is called to init the widget
      */
    ywidAddSubType(paw)

    var sw = yeCreateArray(mod, "starting widget")
    yeCreateString("polis-at-war", sw, "<type>")

    var sz = ywSizeCreate(800, 600)

    yePushBack(mod, sz, "window size")
    /* 
     * above lines that push stuff into 'mob' init the mod array entity
     * json form of mod should now be:
     * { "starting widget" : {"<type>": "polis-at-war"}, "window size": [800, 600] }
     */
    return mod /* now go to paw_init, it will be automatically called by YIRL */
}
