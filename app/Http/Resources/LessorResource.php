<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LessorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        // return parent::toArray($request);
        // dd($request);
        return [
            // 'id' => $this->lessorCode,
            // 'lessorName' => $this->lessorName,
            // 'lessorStatus' => $this->lessorStatus,
            // 'userAdded' => $this->userAdded,
            // 'dateAdded' => $this->dateAdded,
            // 'userUpdated' => $this->userUpdated,
            // 'dateUpdated' => $this->dateUpdated
            'id' => $this['lessorCode'],
            'lessorName' => $this['lessorName'],
            'lessorStatus' => $this['lessorStatus'],
            'userAdded' => $this['userAdded'],
            'dateAdded' => $this['dateAdded'],
            'userUpdated' => $this['userUpdated'],
            'dateUpdated' => $this['dateUpdated']
        ];
    }
}
