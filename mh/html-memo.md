# htmlメモ
* divタグなどで改行させたくない時→
** spanタグで囲む **

* エンターキーでformを送信したくない時(ボタンのみで送信させたい)→
`<button type="button">`

* bootstrapでmodalを閉じたい時→　`$('#myModal').modal('hide');`

* inputでの入力値をクリアしたい時→
`$('#input-field>input').each(function(){$(this).val('');
});`

id要素の子要素のinputタグを全て取得して
value値にnull文字を代入している

* inputでの未入力値を判定したいとき→　`!str.match(/\S/g)`

正規表現の\Sは空白文字以外の文字のこと
